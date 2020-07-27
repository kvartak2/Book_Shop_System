import assert from 'assert';
//import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import querystring from 'querystring';

import ModelError from './model-error.mjs';

//not all codes necessary
const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;
const BAD_ID = 404;

const BASE = 'api';

export default function serve(port, meta, model)
{
  const app = express();
  app.locals.port = port;
  app.locals.meta = meta;
  app.locals.model = model;
  setupRoutes(app);
  app.listen(port, function()
  {
    console.log(`listening on port ${port}`);
  });
}

function setupRoutes(app)
{
  const base = app.locals.base;

  //app.use(cors());

  //pseudo-handlers used to set up defaults for req
  app.use(bodyParser.json());      //always parse request bodies as JSON
  app.use(reqSelfUrl, reqBaseUrl); //set useful properties in req

  //application routes
  app.get(`/${BASE}`, doBase(app));

  //Point-10
  app.post(`/${BASE}/carts`,doCreate(app));

  //Point-11
  app.patch(`/${BASE}/carts/:id`,doUpdate(app));

  //Point-12(individual book)
  app.get(`/${BASE}/books/:id`,doFindBooks(app));

  //Point-13(individual cart)
  app.get(`/${BASE}/carts/:id`,doFindCarts(app));

  //Point-14(search books)
  app.get(`/${BASE}/books`,doSearchBooks(app));
  //@TODO: add other application routes



  //must be last

  app.use(do404(app));
  app.use(doErrors(app));

}

/****************************** Handlers *******************************/

/** Sets selfUrl property on req to complete URL of req,
 *  including query parameters.
 */
function reqSelfUrl(req, res, next)
{
  const port = req.app.locals.port;
  req.selfUrl = `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;

  next();  //absolutely essential
}

/** Sets baseUrl property on req to complete URL of BASE. */
function reqBaseUrl(req, res, next)
{
  const port = req.app.locals.port;
  req.baseUrl = `${req.protocol}://${req.hostname}:${port}/${BASE}`;
  //console.log("baseUrl="+req.baseUrl);
  next(); //absolutely essential
}

function doBase(app)
{
  return function(req, res)
  {
    try
    {
      const links = [
	{ rel: 'self', name: 'self', href: req.selfUrl, },
	{ rel: 'collection', name: 'books', href: req.selfUrl + "/books", },
	{ rel: 'collection', name: 'carts', href: req.selfUrl + "/carts", }
	//@TODO add links for book and cart collections
      ];
      res.json({ links });
    }
    catch (err)
    {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  };
}
function doCreate(app)
{
  return errorWrap(async function(req, res)
  {
    try
    {
      const obj = req.body;

      const results = await app.locals.model.newCart(obj);
      res.append('Location', requestUrl(req) + '/' + obj.id);
      res.sendStatus(CREATED);
    }
    catch(err)
    {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doUpdate(app)
{
  return errorWrap(async function(req, res)
  {
    try
    {
      const patch = Object.assign({}, req.body);
      patch.cartId = req.params.id;
      const results = await app.locals.model.cartItem(patch);
      res.json();
      //res.sendStatus(OK);
    }
    catch(err)
    {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doFindBooks(app)
{
  return errorWrap(async function(req, res)
  {
    try
    {
      let resObj = {};
      let reqUrl = requestUrl(req);
      let t = Object.keys(req.query);
      const id = req.params.id;
      const results = await app.locals.model.findBooks({ isbn: id });
      if (results.length === 1)
      {
      	if(!checkIfUndefOrNull(results))
      	{
      	  let obj = results[0];
	  let sendInfo = custom_fun(reqUrl,'self','self');
	  sendInfo.href = sendInfo.href;
	  delete sendInfo.url;
	  resObj.links = [sendInfo];
	  resObj.result = obj;
      	  res.json(resObj);
      	}
      }
      else
      {
      	throw {
	code: 'BAD_ID',
	message: `no book for isbn ${id}`,
	name : "isbn"
	};
      }
    }
    catch(err)
    {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doFindCarts(app)
{
  return errorWrap(async function(req, res)
  {
    try
    {
      let resObj = {};
      const q = req.query;
      let reqUrl = requestUrl(req);
      let cat = reqUrl.substring(reqUrl.lastIndexOf("/")+1,reqUrl.length +1);
      let len = reqUrl.length;
      const id = req.params.id;
      const searchBooksObj = await app.locals.model.getCart({ cartId: id });

      let JSON_obj = [];let last_mod;

      for (const prop in searchBooksObj)
      {
      	if(prop !== '_lastModified')
      	{
      	  let k = prop;
      	  let v = searchBooksObj[prop];
      	  let bookUrl = req.baseUrl + "/books/" + k;
      	  let a = custom_fun(bookUrl,'book','item',q);

      	  JSON_obj.push({"sku" : k , "nUnits" : v,"links":[a]});
      	}
      	else if(prop === '_lastModified')
      	{
      	  last_mod = searchBooksObj[prop];
      	}
      }
	
      let links = [];

	let obj = JSON_obj;
      	let selfLink = custom_fun(reqUrl,'self','self',q);
      	links.push(selfLink);
      	resObj._lastModified = last_mod;
      	resObj.result = obj;
      	resObj.links=links;

      	res.json(resObj);
      	
    }
    catch(err)
    {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doSearchBooks(app)
{
  return errorWrap(async function(req, res)
  {
    try
    {
      let responseobj = {}
      let q =req.query;


      let reqUrl = requestUrl(req);

      const searchBooksObj = await app.locals.model.findBooks(q);
      let q1=Object.assign({},q);delete q1._index;
      //delete q1._count;

      const MAX_CNT = 999;
      if(!q1.hasOwnProperty('_count'))
      {
        q1._count = MAX_CNT;
      }
      else
      {
      	delete q1._count;
      }

      const searchBooksObj1 = await app.locals.model.findBooks(q1);
      const searchBooksObj1_len = searchBooksObj1.length;
      const searchBooksObj_len = searchBooksObj.length;
      //res.json({searchBooksObj1_len});

      searchBooksObj.forEach((val,i,arr)=>
      {
      let bookUrl = req.baseUrl + "/books/" + val.isbn;
      	let a = custom_fun(bookUrl,'book','details',q,val.id);
      	a.href =a.url;
      	delete a.url;
      	val.links = [a];
      });

      	let links = [];
      	let catlen = searchBooksObj.length;
      	let plus = q._index;




      	if(q.hasOwnProperty('_count') && q.hasOwnProperty('_index'))
      	{
      	  let plus = (parseInt(q._count) + parseInt( q._index));

      	  //if(searchBooksObj.length >= q._count)

      	  if(searchBooksObj1_len > plus)
      	  {

	    	//const t = 'next link';res.json({t});
      	  	const nextLink = custom_fun(reqUrl,'next','next',q,"",responseobj);
      	    	links.push(nextLink);

      	  }
      	  if(q._index > 0)
      	  {
      	  	const prevLink = custom_fun(reqUrl,'prev','prev',q,"",responseobj);
      	  	links.push(prevLink);
      	  }
      	}

      	else if(q.hasOwnProperty('_count'))
      	{
      	  let qS = Object.assign({},q);qS._index = 0;
      	  if(searchBooksObj1.length > q._count){const nextLink = custom_fun(reqUrl,'next','next',qS,"",responseobj);links.push(nextLink);}
      	}
      	else if(q.hasOwnProperty('_index'))
      	{
      	  let qS = Object.assign({},q);qS._index = 0;
      	  if(searchBooksObj.length >= 0 && searchBooksObj.length >= DEFAULT_COUNT){const nextLink = custom_fun(reqUrl,'next','next',q,"",responseobj);links.push(nextLink);}
      	  if(q._index > 0) {const prevLink = custom_fun(reqUrl,'prev','prev',q,"",responseobj);links.push(prevLink);}
      	}

      	else if(!q.hasOwnProperty('_count') && !q.hasOwnProperty('_index'))
      	{
      		//res.json(searchBooksObj1_len);
      	  if(searchBooksObj1.length > DEFAULT_COUNT) {q._index = 0; const nextLink = custom_fun(reqUrl,'next','next',q,"",responseobj);links.push(nextLink);}
      	}

      	else if(checkIfUndefOrNull(q))
      	{
      	//res.json(searchBooksObj_len);
      	  if(searchBooksObj1.length > DEFAULT_COUNT) {const nextLink = custom_fun(reqUrl,'next','next',q,"",responseobj);links.push(nextLink);}
      	}

      	let obj = searchBooksObj;
      	let selfLink = custom_fun(reqUrl,'self','self',q);
      	links.push(selfLink);
      	responseobj.results = obj;
      	responseobj.links=links;

     res.json(responseobj);

    }
    catch(err)
    {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}
//@TODO: Add handlers for other application routes





/** Default handler for when there is no route for a particular method
 *  and path.
 */

function do404(app)
{
  return async function(req, res,)
  {
    const message = `${req.method} not supported for ${req.originalUrl}`;
    const result =
    {
      status: NOT_FOUND,
      errors: [	{ code: 'NOT_FOUND', message, }, ],
    };
    res.type('text').
	status(404).
	json(result);
  };
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */
function doErrors(app)
{
  return async function(err, req, res, next)
  {
    const result =
    {
      status: SERVER_ERROR,
      errors: [ { code: 'SERVER_ERROR', message: err.message } ],
    };
    res.status(SERVER_ERROR).json(result);
    console.error(err);
  };
}


/*************************** Mapping Errors ****************************/
function errorWrap(handler)
{
  return async (req, res, next) =>
  {
    try
    {
      await handler(req, res, next);
    }
    catch (err)
    {
      next(err);
    }
  };
}

const ERROR_MAP =
{
  NOT_FOUND: NOT_FOUND,
  BAD_ID: BAD_ID
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code and an errors property containing list of error objects
 *  with code, message and name properties.
 */
function mapError(err)
{
  let status,errors;
  const isDomainError = (err instanceof Array && err.length > 0 && err[0] instanceof ModelError);


  if(err.code === 'BAD_ID')
  {
  	status = BAD_ID;

  	errors = [{code: err.code, meaasge : err.message.toString(),name:err.name}]
  }
  else
  {
    status = isDomainError ? (ERROR_MAP[err[0].code] || BAD_REQUEST) : SERVER_ERROR;
    errors = isDomainError ? err.map(e => ({ code: e.code, message: e.message, name: e.name })) : [ { code: 'SERVER_ERROR', message: err.toString(), } ];
  }


  return {status,errors};
}

/****************************** Utilities ******************************/
function requestUrl(req)
{
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}
function custom_fun(link,name,rel,q = {},param,responseObj)
{
  try
  {
    let query = Object.assign({},q);
    
    let flag = 0;
    let Url,returnObj
    let qStr = '';
    param = param || '';
    param = checkIfUndefOrNull(param) ? param : '/'+ param;
    if(checkIfUndefOrNull(param))
    {
    if((name === "next") || (name === "prev"))
    {
    	let nI, pI;
    	
    	if(q.hasOwnProperty('_index') && q.hasOwnProperty('_count'))
    	{
    	  nI = parseInt(query._index) + parseInt(query._count); 
    	  pI = parseInt(query._index) - parseInt(query._count); pI = pI < 0 ? 0 : pI;
    	  //pI = parseInt(query._index) - parseInt(query._count);
    	  if(name === "prev") {query._index = pI; }
    	  else if(name === "next") {query._index = nI; }
    	  flag =1;
    	}
    	else if(!q.hasOwnProperty('_index') && q.hasOwnProperty('_count'))
    	{
    	  nI = parseInt(query._index) + parseInt(query._count);
    	  //pI = parseInt(query._index) - parseInt(query._count);
    	  if(name === "prev") {query._index = pI; }
    	  else if(name === "next") {query._index = nI; }
    	}
    	else if(!q.hasOwnProperty('_count') && q.hasOwnProperty('_index'))
    	{
    	  nI = parseInt(query._index) + DEFAULT_COUNT; 
    	  pI = parseInt(query._index) - DEFAULT_COUNT; pI = pI < 0 ? 0 : pI;
    	  //pI = parseInt(query._index) - parseInt(query._count);
    	  if(name === "prev"){query._index = pI;}
    	  else if(name === "next"){query._index = nI;}
    	  flag =1;
    	}

    	else if(checkIfUndefOrNull(query))
    	{
    	  nextIndex = DEFAULT_COUNT;
    	  if(name === "next") {query._index = nI; responseObj.next = nI;}
    	}
	//console.log(query._index)
    	qStr = Object.keys(query).map(key => key + '=' +query[key]).join('&');
    	//console.log('paramhas error');
    	qStr = checkIfUndefOrNull(qStr) ? '' : '?' + qStr;
	//console.log('param may be UndefOrNull');
	
	
	
	let Ind_Cnt_prev = checkIfUndefOrNull(query._count) ? '&_index=' + query._index : '&_index=' + query._index + '&_count=' + query._count;
    
    	let Ind_Cnt_next = checkIfUndefOrNull(query._count) ? '&_index=' + query._index : '&_index=' + query._index + '&_count=' + query._count;
    
    	let lnk_prev = link.split('&')[0].concat(Ind_Cnt_prev);
    	let lnk_next = link.split('&')[0].concat(Ind_Cnt_next);
    	
    	if(name === 'prev')
    	{
    	  Url = lnk_prev
    	}
    	else if(name === 'next')
    	{
    	  Url = lnk_next
    	}
    	else
    	{
    	  Url = link + param + qStr
    	  
    	}
    	console.log("---")
    	console.log(Url)
    }
    else if(name === 'self')
    {
    	qStr = Object.keys(query).map(key => key + '=' +query[key]).join('&');
    	//console.log('paramhas error');
    	qStr = checkIfUndefOrNull(qStr) ? '' : '?' + qStr;
    	
    	Url = link ;
    }
    else if(name === 'book')
    {
    	  
    	qStr = Object.keys(query).map(key => key + '=' +query[key]).join('&');
    	//console.log('paramhas error');
    	qStr = checkIfUndefOrNull(qStr) ? '' : '?' + qStr;
    	
    	Url = link +param + qStr;
    	
    }
    }
    
    
    returnObj = {href : Url, name :name, rel:rel};
    return returnObj
    
  }
  catch(e)
  {
    console.error(e);
  }
}
function checkIfUndefOrNull(value)
{
  //checking ig the current object is null or undefined or length is <= 0
	return (value === undefined) || (value === null) || (value.length <= 0) || (Object.keys(value).length <= 0);
}



const DEFAULT_COUNT = 5;
