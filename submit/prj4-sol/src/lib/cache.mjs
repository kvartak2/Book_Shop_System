//<https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage>
const STORE = window.sessionStorage;

export default class Cache 
{
  constructor(store=STORE) 
  {
    this.store = store;
    
  }
	
  /** return object stored for key in this cache; 
   *  returns falsy if not found. 
   */
  get(key) 
  {
    const value = sessionStorage.getItem(key);
    return value && JSON.parse(value);
    
    
    //@TODO
  }

  /** cache object val under key in this cache.  
   *  returns this to allow chaining.
   */
  set(key, val) 
  {
    //@TODO
    return this.store.setItem(key,JSON.stringify(val));this;
  }
  
}
