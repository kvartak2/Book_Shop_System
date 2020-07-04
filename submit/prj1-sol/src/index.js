import './style.css';

import $ from 'jquery';        //make jquery() available as $
import Meta from './meta.js';  //bundle the input to this program

//default values
const DEFAULT_REF = '_';       //use this if no ref query param
const N_UNI_SELECT = 4;        //switching threshold between radio & select
const N_MULTI_SELECT = 4;      //switching threshold between checkbox & select

/*************************** Utility Routines **************************/

/** Return `ref` query parameter from window.location */
function getRef()
{
  const url = new URL(window.location);
  const params = url.searchParams;
  return params && params.get('ref');
}

/** Return window.location url with `ref` query parameter set to `ref` */
function makeRefUrl(ref)
{
  const url = new URL(window.location);
  url.searchParams.set('ref', ref);
  return url.toString();
}

/** Return a jquery-wrapped element for tag and attr */
function makeElement(tag, attr={})
{
  const $e = $(`<${tag}/>`);
  Object.entries(attr).forEach(([k, v]) => $e.attr(k, v));
  return $e;
}

/** Given a list path of accessors, return Meta[path].  Handle
 *  occurrences of '.' and '..' within path.
 */
function access(path)
{
  const normalized = path.reduce((acc, p) =>
  {
    if (p === '.')
    {
      return acc;
    }
    else if (p === '..')
    {
      return acc.length === 0 ? acc : acc.slice(0, -1)
    }
    else
    {
      return acc.concat(p);
    }
  }, []);
  return normalized.reduce((m, p) => m[p], Meta);
}

/** Return an id constructed from list path */
function makeId(path)
{
  return ('/' + path.join('/'));
}

function getType(meta)
{
  return meta.type || 'block';
}

/** Return a jquery-wrapped element <tag meta.attr>items</tag>
 *  where items are the recursive rendering of meta.items.
 *  The returned element is also appended to $element.
 */
function items(tag, meta, path, $element)
{
  const $e = makeElement(tag, meta.attr);
  (meta.items || []).
    forEach((item, i) => render(path.concat('items', i), $e));
  $element.append($e);
  return $e;
}

/************************** Event Handlers *****************************/

//@TODO

function function_test(meta, path, $element)
{
  $(document).ready(function()
  {
    $("input").on('blur', function(e)
    {
      var target = e.target;
      let curr_id = e.target.id;


      let target_error_id= e.target.id.concat("-error");

      if(e.target.type !== 'radio' || e.target.type !== 'checkbox')
      {
        if(curr_id === meta.id)
        {
          if(((e.target.value).trim() === '') && (meta.required === true))
          {

            $.each($('.error'), function()
            {
              if((this.id === target_error_id) && (($(this).text()).trim() === ''))
              {
                $(this).text(`The field ${meta.text} must be specified.`);
              }
            });
          }
          else if(((e.target.value).trim() !== '') && (meta.chkFn))
          {

            $.each($('.error'), function()
            {
              if(this.id === target_error_id)
              {
                // alert("error");
                if((($(this).text()).trim() === ''))
                {
                  let return_chkFn = meta.chkFn(e.target.value,);

                  if(return_chkFn === null)
                  {
                      // console.log("In if-if");
                      let err_msg_fun = meta.errMsgFn(e.target.value,meta);
                      $(this).text(err_msg_fun);
                  }
                  else
                  {
                    var aaa=return_chkFn;
                    if(aaa === e.target.value)
                    {
                      $(this).text('');
                    }


                  }
                }
                else if((($(this).text()).trim() !== ''))
                {
                  let return_chkFn = meta.chkFn(e.target.value,);

                  if(return_chkFn !== null)
                  {
                    if(return_chkFn[0] === e.target.value)
                    {
                      $(this).text('');
                    }
                  }
                }
              }
              else if((this.id === curr_id))
              {
                alert("($(this).text()).trim()="+($(this).text()).trim());
              }
            });
          }
          else if(((e.target.value).trim() !== '') && (!meta.chkFn))
          {

            $.each($('.error'), function()
            {
              if((this.id === target_error_id))
              {
                if((($(this).text()).trim() === ''))
                {
                  $(this).text(``);
                }
                else if((($(this).text()).trim() !== ''))
                {
                  $(this).text(``);
                }

              }
            });
          }
        }
      }
    });
    $("input").on('change', function(e)
    {
      if(e.target.type === 'radio' || e.target.type === 'checkbox')
      {
        if((e.target.type === 'radio') && (e.target.name === meta.attr.name))
        {
          let curr_id = e.target.id;
          let target_error_id= e.target.id.concat("-error");
          // console.log("meta.attr.name="+e.target.name);
          // console.log(($('#radio_button').is(':checked')));
          var n = $("input:radio:checked").length;
          // alert("n="+n);
          $.each($('.error'), function()
          {
            if((this.id === target_error_id))
            {
              if(meta.required === true)
              {
                if(n <= 0)
                {
                  if(($(this).text()).trim() === '')
                  {
                    // console.log("select is empty");
                    /*need to change*/
                    $(this).text(`The field ${e.target.name} must be specified.`);
                  }
                }
              }
              else if((meta.required === true) && (n > 0))
              {
                if(($(this).text()).trim() !== '')
                {
                  $(this).text('');
                }
              }

            }
          });
        }
        else if((e.target.type === 'checkbox') && (e.target.name === meta.attr.name))
        {

          let curr_id = e.target.id;
          let target_error_id= e.target.id.concat("-error");
          var n = $("input:checkbox:checked").length;
          $.each($('.error'), function()
          {
            if((this.id === target_error_id))
            {
              if((meta.required === true) && (n <= 0))
              {

                  if(($(this).text()).trim() === '')
                  {
                    // console.log("sdjgfkjsdf-----event.target.type="+e.target.name);
                    $(this).text(`The field ${e.target.name} must be specified.`);
                  }


              }
              else if((meta.required === true) && (n > 0))
              {
                // console.log("hi-1="+$(this).text().trim());
                if(($(this).text()).trim() !== '')
                {
                  $(this).text('');
                }

              }

            }
          });
        }
      }
    });
    $("select").on('change', function(e)
    {
      var target = e.target;
      var curr_id = e.target.id;
      let target_error_id= e.target.id.concat("-error");
      // console.log("select-target id="+meta.type);
      if(meta.type === "uniSelect")
      {

        var optionSelected = $("option:selected", this);
        var valueSelected = this.value;

        $.each($('.error'), function()
        {
          if((this.id === target_error_id) && (valueSelected === '') && (meta.required === true))
          {
            if(($(this).text()).trim() === '')
            {
              $(this).text(`The field ${meta.text} must be specified.`);
            }
          }
          else if((this.id === target_error_id) && (valueSelected !== '') && (meta.required === true))
          {
            if(($(this).text()).trim() !== '')
            {
              $(this).text('');
            }
          }
        });
      }
    });
  });
}

function block(meta, path, $element)
{
  items('div', meta, path, $element);
}

function form(meta, path, $element)
{
  const $form = items('form', meta, path, $element);

  $form.submit(function(event)
  {
    let flag_exist_error = 0;
    event.preventDefault();

    const $form = $(this);

    $('input,textarea').trigger('blur');
    $('input,select').trigger('change');

    $.each($('.error'), function()
    {
      if($(this).text() !== '')
      {
        flag_exist_error = 1;
      }
    });

    if(flag_exist_error === 0)
    {
      const results = $('form').serializeArray();
      var results1 = {};
      // console.log("results="+results);
      $.each(results, function(i, field)
      {
        var $a = $(`[name="${this.name}"]`, $form)[0];

        if(($a.name === 'multiSelect') || ($a.type === 'checkbox'))
        {
          var mult_arr;
          results1[this.name] = (results1[this.name] || []).concat(this.value);
        }
        else
        {
          results1[this.name] = this.value;
        }

      });
      console.log(JSON.stringify(results1, null, 2));
    }



  });

}

function header(meta, path, $element)
{
  const $e = makeElement(`h${meta.level || 1}`, meta.attr);
  $e.text(meta.text || '');
  $element.append($e);
}

function input(meta, path, $element)
{
  function_test(meta, path, $element);
  //@TODO
  const $e = makeElement('div');
  const $error = makeElement('div');
  const $lbl = (meta.required) ? meta.text + "*" : meta.text;
  if(!meta.id)
  {
    meta.id = makeId(path);
  }
  const error_id = meta.id.concat("-error");
  if(meta.subType === 'textarea')
  {
    const attr = Object.assign(meta.attr);
    $element.append(makeElement('label').text($lbl).attr('for',meta.id),$e);
    $e.append(makeElement('textarea',attr).text(meta.subType).attr('id',meta.id).attr('type',meta.subType),$error);
    $error.addClass('error').attr('id',error_id);
  }
  else
  {
    const attr = Object.assign(meta.attr);
    $element.append(makeElement('label').text($lbl).attr('for',meta.id),$e);
    $e.append(makeElement('input',attr).text(meta.subType).attr('id',meta.id).attr('type',meta.subType),$error);
    $error.addClass('error').attr('id',error_id);

  }
}

function link(meta, path, $element)
{

  const parentType = getType(access(path.concat('..')));
  const { text='', ref=DEFAULT_REF } = meta;
  const attr = Object.assign({}, meta.attr||{}, { href: makeRefUrl(ref) });
  $element.append(makeElement('a', attr).text(text));
}

function multiSelect(meta, path, $element)
{
  function_test(meta, path, $element);
  //@TODO
  const $e = makeElement('div');
  const $error = makeElement('div');
  var $opt = makeElement('option');
  const $lbl = (meta.required) ? meta.text + "*" : meta.text;
  const $div_fieldset = makeElement('div');

  if(!meta.id)
  {
    meta.id = makeId(path);
  }
  const error_id = meta.id.concat("-error");
  const attr = Object.assign(meta.attr);
  $element.append(makeElement('label').text($lbl).attr('for',meta.id),$e);
  if((meta.items.length > N_MULTI_SELECT) || (meta.items.length > 4))
  {
    const $append_to_e =makeElement('select',attr).attr('multiple','multiple');
    $append_to_e.appendTo($e);

    for(var i=0;i<meta.items.length;i++)
    {
      $opt = makeElement('option').text(meta.items[i].text).attr('value',meta.items[i].key);
      $opt.appendTo($append_to_e);
    }
    $error.addClass('error').attr('id',error_id);
    $error.appendTo($e);
  }
  else
  {
    $e.append($div_fieldset);
    $div_fieldset.addClass('fieldset');
    for(var i=0;i<meta.items.length;i++)
    {
      const $checkbox = makeElement('input').attr('name',meta.attr.name).attr('id',meta.id).attr('type','checkbox').attr('value',meta.items[i].key);
      $checkbox.appendTo($div_fieldset);

      const $checkbox_lbl = makeElement('label').text(meta.items[i].key).attr('for',meta.id);
      $checkbox_lbl.appendTo($div_fieldset);
    }
    $error.addClass('error').attr('id',error_id);
    $error.appendTo($e);
  }
}

function para(meta, path, $element)
{
  items('p', meta, path, $element);
}

function segment(meta, path, $element)
{
  if (meta.text !== undefined)
  {
    $element.append(makeElement('span', meta.attr).text(meta.text));
  }
  else
  {
    items('span', meta, path, $element);
  }
}

function submit(meta, path, $element)
{
  //@TODO

  // function_test(meta, path, $element);

  const $e = makeElement('div');
  $element.append($e);
  const attr = Object.assign({},meta.attr);
  if (meta.text !== undefined)
  {
    $element.append(makeElement('button', attr).text(meta.text).attr('type',meta.type));
  }
  else
  {
    $element.append(makeElement('button', attr).text(meta.type).attr('type',meta.type));
  }



}

function uniSelect(meta, path, $element)
{
  function_test(meta, path, $element);
  //@TODO
  const $e = makeElement('div');
  const $error = makeElement('div');
  var $opt = makeElement('option');

  const $lbl = (meta.required) ? meta.text + "*" : meta.text;
  const $div_fieldset = makeElement('div');

  if(!meta.id)
  {
    meta.id = makeId(path);
  }
  const error_id = meta.id.concat("-error");
  const attr = Object.assign(meta.attr);
  $element.append(makeElement('label').text($lbl).attr('for',meta.id),$e);
  $error.addClass('error').attr('id',error_id);
  if((meta.items.length > N_UNI_SELECT) || (meta.items.length > 4))
  {
    const $append_to_e =makeElement('select',attr).attr('id',meta.id);
    $append_to_e.appendTo($e);

    for(let i=0;i<meta.items.length;i++)
    {
      $opt = makeElement('option').text(meta.items[i].text).attr('value',meta.items[i].key);
      $opt.appendTo($append_to_e);
    }

    $error.appendTo($e);
  }
  else
  {
    $e.append($div_fieldset);
    $div_fieldset.addClass('fieldset');
    for(var i=0;i<meta.items.length;i++)
    {
      const $radio = makeElement('input').attr('name',meta.attr.name).attr('id',meta.id).attr('type','radio').attr('value',meta.items[i].key);
      $radio.appendTo($div_fieldset);

      const $radio_lbl = makeElement('label').text(meta.items[i].key).attr('for',meta.id);
      $radio_lbl.appendTo($div_fieldset);
    }

    $error.appendTo($e);
  }
}


//map from type to type handling function.
const FNS =
{
  block,
  form,
  header,
  input,
  link,
  multiSelect,
  para,
  segment,
  submit,
  uniSelect,
  function_test,
};

/*************************** Top-Level Code ****************************/

function render(path, $element=$('body'))
{
  const meta = access(path);
  if (!meta)
  {
    $element.append(`<p>Path ${makeId(path)} not found</p>`);
  }
  else
  {
    const type = getType(meta);
    const fn = FNS[type];
    if (fn)
    {
      fn(meta, path, $element);
    }
    else
    {
      $element.append(`<p>type ${type} not supported</p>`);
    }
  }
}

function go()
{
  const ref = getRef() || DEFAULT_REF;
  render([ ref ]);
}

go();
