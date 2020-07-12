import META from './meta.mjs';
import Validator from './validator.mjs';
import ModelError from './model-error.mjs';

import mongo from 'mongodb';

import assert from 'assert';
import util from 'util';


/**

All detected errors should be reported by throwing an array of
ModelError objects.

Errors are of two types:

  + *Local errors* depend only on the field values of the current data
    item.  Local errors are specified and checked using meta.mjs
    and validator.mjs and are not specified below.

  + *Global errors* depend on data items other than the current data
    item.  The comments for the code below document global errors.

Each ModelError must be specified with an error code (defined below)
and an error message which should be as specific as possible.  If the
error is associated with a particular field, then the internal name of
that field should be filled in to the ModelError object.  Note that if
an error message refers to the name of the field, it should do so
using the external name (`label`) of the field.

The codes for the ModelError include the following:

BAD_ACT:
  Action does not correspond to one of the model action routines.

BAD_FIELD:
  An object contains an unknown field name or a forbidden field.

BAD_FIELD_VALUE:
  The value of a field does not meet its specs.

BAD_ID:
  Object not found for specified ID.  Includes an error when some field
  specifies an id for some other object, but there is no object having
  that ID.

DB:
  Database error

FORM_ERROR:
  Form is invalid.

MISSING_FIELD:
  The value of a required field is not specified.

*/

export default class Model
{

  /** Set up properties from props as properties of this. */
  constructor(props)
  {
    Object.assign(this, props);
  }

  /** Return a new instance of Model set up to use database specified
   *  by dbUrl
   */
  static async make(dbUrl)
  {

    if(dbUrl.match(/^(mongodb:(?:\/{2})?)((localhost)|(\d{1,3}.{3}.{3}:[0-9]{5}$))/ig) === null)
    {
      throw [ new ModelError(`BAD URL', 'Use url as mongodb://HOST:PORT`) ];
    }

    let client;
    const dbName = 'myproject';
    try
    {
      //@TODO

      client = await mongo.connect(dbUrl,MONGO_CONNECT_OPTIONS);
      const db = await client.db(dbName);
      const cart_catalog = await db.collection('books');
      const book_catalog = await db.collection('books');
      await book_catalog.createIndex({isbn:1});
      await book_catalog.createIndex({ authors: 'text',title: 'text'});

      const props =
      {
      	validator: new Validator(META),
        client,db,cart_catalog,book_catalog,
      	//@TODO other properties

      };

      const model = new Model(props);
      return model;
    }
    catch (err)
    {
      const msg = `cannot connect to URL "${dbUrl}": ${err}`;
      throw [ new ModelError('DB', msg) ];
    }
  }

  /** Release all resources held by this model.  Specifically,
   *  close any database connections.
   */
  async close()
  {
    try
    {
      await this.client.close();
    }
    catch (err)
    {
      throw new UserError('DB', err.toString());
    }
  }

  /** Clear out all data stored within this model. */
  async clear()
  {
    //@TODO
    await this.cart_catalog.deleteMany({});
    await this.book_catalog.deleteMany({});
  }

  //Action routines

  /** Create a new cart.  Returns ID of newly created cart.  The
   * returned ID should not be generated by the database; it should
   * also not be easily guessable.
   *
   *  The new cart should have a `_lastModified` field set to the
   *  current Date timestamp.
   */
  async newCart(rawNameValues)
  {
    const nameValues = this._validate('newCart', rawNameValues);
    //@TODO

    const random_id = randomId(nameValues);
    nameValues._lastModified=new Date().toISOString();

    await this.cart_catalog.insertMany([random_id], function (err, result)
    {
        // assert.equal(err, null);
    });
    return nameValues._id;
  }

  /** Given fields { cartId, sku, nUnits } = rawNameValues, update
   *  number of units for sku to nUnits.  Update `_lastModified` field
   *  of cart to current Date timestamp.
   *
   *  Global Errors:
   *    BAD_ID: cartId does not reference a cart.
   *            sku does not specify the isbn of an existing book.
   */
  async cartItem(rawNameValues)
  {
    const nameValues = this._validate('cartItem', rawNameValues);
    const nameValues_lastModified=new Date().toISOString();


    let errmsg = [];

    let chk_isbn = await this.findBooks({isbn:nameValues.sku});

    if(chk_isbn.length === 0)
    {
      const msg = `BAD ID: unknown sku ${nameValues.sku}`;
      throw [ new ModelError('sku', msg)];
    }
    else
    {
      if(nameValues.nUnits === 0)
      {

        await this.cart_catalog.update({_id : Number(nameValues.cartId)},{$unset : {[nameValues. sku]:nameValues. nUnits}},{$set : {_lastModified : nameValues_lastModified}})
        .then(result =>{
          // console.log("Updated");

        })
        .catch((err) =>
        {
          console.log('Error: ' + err);
        })
      }
      else
      {
        await this.cart_catalog.updateOne({_id : Number(nameValues.cartId)},{$set : {[nameValues. sku]:nameValues. nUnits, _lastModified : nameValues_lastModified}})
        .then(result =>{
          const { matchedCount, modifiedCount } = result;
          if(matchedCount !== 1)
          {
            errmsg.push(new ModelError('BAD_ID:no updates for cart',nameValues.cartId, 'cartId'));
            throw errmsg;
          }
        });
      }
    }
    //@TODO
  }

  /** Given fields { cartId } = nameValues, return cart identified by
   *  cartId.  The cart is returned as an object which contains a
   *  mapping from SKU's to *positive* integers (representing the
   *  number of units of the item identified by the SKU contained in
   *  the cart).  Addtionally, it must also have a `_lastModified`
   *  property containing a Date timestamp specifying the last time the
   *  cart was modified.
   *
   *  Globals Errors:
   *    BAD_ID: cartId does not reference a cart.
   */
  async getCart(rawNameValues)
  {
    //@TODO
    let rslt;
    const nameValues = this._validate('getCart', rawNameValues);
    let crtID = Number(nameValues.cartId);
    await this.cart_catalog.findOne({'_id' : crtID}, {fields: {'_id': 0}})
    .then(result =>
      {
        rslt=result;
      });
      return rslt;
  }

  /** Given fields { isbn, title, authors, publisher, year, pages } =
   *  nameValues for a book, add the book to this model.  The isbn
   *  field should uniquely identify the book.  Note that if the book
   *  already exists in this model, then this routine should merely
   *  update the information associated with the book.
   *
   *  Returns the isbn of the added/updated book.
   *
   *  This routine should set a `_lastModified` field in the book to
   *  the current Date timestamp.
   */
  async addBook(rawNameValues)
  {
    const nameValues = this._validate('addBook', rawNameValues);
    //@TODO


    const nameValues_lastModified=new Date().toISOString();
    await this.book_catalog.updateOne({isbn : nameValues.isbn},{$set : {nUnits : nameValues.nUnits,title : nameValues.title,authors : nameValues.authors,pages : nameValues.pages,year : nameValues.year,publisher : nameValues.publisher,_lastModified : nameValues_lastModified}},{upsert: true})
    .then(result =>{/*console.log("Updated");*/});
    return nameValues.isbn;
  }

  /** Given fields { isbn, authorsTitle, _count=COUNT, _index=0 } =
   *  nameValues, retrieve list of all books with specified isbn (if
   *  any) and the words specified in authorsTitle occurring in either
   *  the book's authors field or the title field.  The retrieved
   *  results are sorted in ascending order by title.  The returned
   *  results have up to _count books starting at index _index in the
   *  retrieved results.  The `_index` and `_count` fields allow
   *  paging through the search results.
   *
   *  Will return [] if no books match the search criteria.
   */
  async findBooks(rawNameValues)
  {
    const nameValues = this._validate('findBooks', rawNameValues);
    //@TODO

    let keys = Object.keys(nameValues)[0];
    let value= Object.values(nameValues)[0];

    let doc = 0;
    if(keys === 'isbn')
    {
        doc = await this.book_catalog.find({[keys] : value}).sort({title:1}).skip(parseInt(nameValues._index) || INDEX).limit(parseInt(nameValues._count) || COUNT).toArray();
    }
    else if(keys === 'authorsTitleSearch')
    {
        doc = await this.book_catalog.find( { "$text" : { "$search" : value } } ).sort({title:1}).skip(parseInt(nameValues._index) || INDEX).limit(parseInt(nameValues._count) || COUNT).toArray();
    }
    doc = doc.map(val => {val.id = val._id; delete val._id; return val});
    return doc;
  }

  //wrapper around this.validator to verify that no external field
  //is _id which is used by mongo
  _validate(action, rawNameValues) {
    let errs = [];
    let nameValues;
    try {
      nameValues = this.validator.validate(action, rawNameValues);
    }
    catch (err) {
      if (err instanceof Array) { //something we understand
	errs = err;
      }
      else {
	throw err; //not expected, throw upstairs
      }
    }
    if (rawNameValues._id !== undefined) {
      errs.push(new ModelError('BAD_FIELD', '_id field not permitted', '_id'));
    }
    if (errs.length > 0) throw errs;
    return nameValues;
  }


};
function randomId(obj)
{
  obj._id = Math.random();
  return obj
}
//use as second argument to mongo.connect()
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };

//default value for _count in findBooks()
const COUNT = 5;
const INDEX = 0;
//define private constants and functions here.
