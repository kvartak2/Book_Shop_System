//-*- mode: rjsx-mode;

import React from 'react';
import SearchForm from './searchform.jsx';

export default class Books extends React.Component 
{

  constructor(props) 
  {
    super(props);
    this.state =  {search : '' };
    //console.log(props.books);
    //console.log("----"+this.state.search);
    
    //@TODO other initialization
  }

  //@TODO other methods
 
  response(result)
  {
  	event.preventDefault();
  	alert(result);
  }
  render() 
  {
    //@TODO complete rendering
    
    const components = {
      searchform: <SearchForm app={this.props} books={this}/>
    };
    return (
    	<React.Fragment>
    	{components.searchform}
    	</React.Fragment>
    );
  }
}
//module.exports = Books;



export function Book({book, full}) 
{
  //@TODO return rendering of book based on full
  return '';
}

//@TODO other components like SearchForm, Results, etc.

/** text for scroll controls */
const SCROLLS = 
{
  next: 'Next >>',
  prev: '<< Previous',
};
