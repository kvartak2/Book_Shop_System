import React from 'react';

export default class SearchForm extends React.Component 
{
  constructor(props) 
  {
    super(props);
    this.ws = props.ws;

    this.onBlur = this.onBlur.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }
  async onBlur(event)
  {
  	let prev_value = '';
  	const target = event.target;
  	const name = target.name;
  	const value = target.value;
  	//this.doSearch(event.target)
  	console.log("in onBlur");
  	const q = (event.target.value).trim();
  	//this.doSearch(q);
  	//console.log(this.state.search);
  }
  async onSubmit(event)
  {
  	event.preventDefault();
  	let selectElement = document.forms[0].querySelector('input[name="authorsTitleSearch"]');
  	
  	const q = (selectElement.value).trim();
	this.doSearch(q);
  }
  async doSearch(props)
  {
  	//console.log("in doSearch");
  	const q = props;
  	//const q = (props || "").trim();
  	this.setState({search : q })
  	const result = await this.props.app.app.ws.findBooks(q);
  	console.log(result.result);
  	this.props.books.response(JSON.stringify(result.result));
  	
  }

  render() 
  {
    return(
    	<form className="search" onSubmit={this.onSubmit}>
      	  <label htmlFor="search">Search Catalog</label>
      	  <input name="authorsTitleSearch" id="search" 
      	  		onBlur={this.onBlur}/>
    	</form>
    );
  }
}

