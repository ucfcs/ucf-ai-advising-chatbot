import {route} from '../../../../../routeconfig';

export function getContacts(callback) {
    let cfs = window.sessionStorage.getItem('contacts');
    if (cfs === null) {
      let options = {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + window.sessionStorage.getItem('token'),
          },
  
      };
  
      fetch(route + 'get_contacts', options)
        .then((res)=> {
            if (res.status === 401) {
              res.json().then((res)=> alert(res['message']));
              callback({});
            } else if (res.status === 200) {
              res.json().then((res)=> {
                window.sessionStorage.setItem('contacts', JSON.stringify(res['contacts']));
                callback(res['contacts']);
              });
            }
        })
        .catch((err) => {
          alert('Failed to retrieve entities.');
          console.log('error occurred', err);
          callback({});
        });
    } else {
      callback(JSON.parse(cfs));
    }
  }