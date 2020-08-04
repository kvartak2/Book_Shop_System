import React from 'react';


export default function Tab(props) {
  const id = props.id;
  const tabbedId = `tabbed${props.index}`;
  const checked = (props.index === 0);
  return (
    <section className="tab">
      <input type="radio" name="tab" className="tab-control"
             id={tabbedId} checked={props.isSelected}
             onChange={() => props.select(id)}/>
        <h1 className="tab-title">
          <label htmlFor={tabbedId}>{props.label}</label>
        </h1>
        <div className="tab-content" id={props.id}>
          {props.component}
        </div>
    </section>
  );
}
/*
import React from 'react';

export default class SearchForm extends React.Component 
{
  constructor(props) 
  {
    super(props);
    //console.log(props);
    this.ws = props.ws;
    //console.log("-----");
    //console.log(this.props.app.app.ws);
   
    this.onBlur = this.onBlur.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }
  async onBlur(event)
  {
  	let prev_value = '';
  	const target = event.target;
  	const name = target.name;
  	const value = target.value;
  	//await app.ws.findBooks({[name] : value});
  	await this.doSearch(event.target)
  	
  }
  async onSubmit(event)
  {
  	event.preventDefault();
  	
  	let selectElement = document.forms[0].querySelector('input[name="authorsTitleSearch"]');

  	//const values = Object.assign({}, {[name] : value});
  	
  	const q = (selectElement.value || "").trim();
  	//const rslt = await this.props.app.app.ws.findBooks(q);
  	doSearch(q);
  	
  	
  }
  async doSearch(props)
  {
  //console.log("in doSearch");
  	const q = (props.value || "").trim();
  	
  	if(q && q!==this.state.search)
  	{
  	this.setState({search : q })
  	const result = await this.props.app.app.ws.findBooks(q);
  	console.log("q="+q);
  	}
  }
  
  handleDataCallback(textMsg)
  {
  	alert(textMsg);
  	console.log(this);
  }
  render() 
  {
    return(
    	<form className="search" onSubmit={this.onSubmit}>
      	  <label htmlFor="search">Search Catalog</label>
      	  <input name="authorsTitleSearch" id="search" 
      	  		onBlur={this.onBlur}
      	  		/>
    	</form>
    );
  }
}
*/
