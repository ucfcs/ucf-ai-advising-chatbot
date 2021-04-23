import {route} from '../../../../../requestUtils';


export function getDocuments(callback) {
    let dfs = window.sessionStorage.getItem('documents');
    if (dfs === null) {
      let options = {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          },
  
      };
  
      fetch(route + 'get_documents', options)
        .then((res)=> {
            if (res.status === 401) {
              res.json().then((res)=> alert(res['message']));
              callback({});
            } else if (res.status === 200) {
              res.json().then((res)=> {
                window.sessionStorage.setItem('documents', JSON.stringify(res['documents']));
                callback(res['documents']);
              });
            }
        })
        .catch((err) => {
          alert('Failed to retrieve entities.');
          console.log('error occurred', err);
          callback({});
        });
    } else {
      callback(JSON.parse(dfs));
    }
  }