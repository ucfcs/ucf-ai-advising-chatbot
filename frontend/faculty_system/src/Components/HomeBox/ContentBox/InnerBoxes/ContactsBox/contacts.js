import {getQuestions} from '../QuestionsBox/questions'
import {route, headers} from '../../../../../requestUtils';
import { getTags } from '../TagsBox/tags';

export const defaultContact = {
  _id:'',
  title:'',
  name:'',
  email:''
}

export function getContacts(callback) {
    let cfs = window.sessionStorage.getItem('contacts');
    if (cfs === null) {
      let options = {
          method: 'GET',
          headers: headers,
      };
  
      fetch(route + 'get_contacts', options)
        .then((res)=> {
            if (res.status === 401) {
              res.json().then((res)=> alert(res['message']));
              callback([]);
            } else if (res.status === 200) {
              res.json().then((res)=> {
                window.sessionStorage.setItem('contacts', JSON.stringify(res['contacts']));
                callback(res['contacts']);
              });
            }
        }).catch((err) => {
          alert('Failed to retrieve entities.');
          console.log('error occurred', err);
          callback([]);
        });
    } else {
      callback(JSON.parse(cfs));
    }
}

export function saveContact(contact, callback) {
  let call = contact._id === '' ? 'add' : 'update'
  let method = contact._id === '' ? 'POST' : 'PUT'
  let succMessage = contact._id === '' ? 'added.' : 'updated.'

  let options = {
    method: method,
    headers: headers,
    body: JSON.stringify({'contact':contact})
  };
  console.log(options);
  fetch(route + call + '_contact', options)
    .then((res)=> {
      if (res.status === 401) {
        callback({
          success:false,
          message: 'User not Authorized'
        });
      } else if (res.status === 200) {
        res.json().then((res)=> {
          callback({
            success:true,
            message:'Contact successfully ' + succMessage,
            contact: res.contact
          });
        });
      } else {
        callback({
          success:false,
          message: 'Failed to ' + call + ' contact'
        });
      }
    }).catch((err)=>{
      callback({
        success:false,
        message:'Contact could not be ' + succMessage
      });
      console.error(err);
    });
}

export function deleteContact(contact, callback) {
  let options = {
    method: 'DELETE',
    headers: headers,
    body: JSON.stringify({'contact':contact})
  };

  fetch(route + 'delete_contact', options)
    .then((res)=> {
      if (res.status === 401) {
        callback({
          success:false,
          message: 'User not Authorized'
        });
      } else if (res.status === 200) {
        callback({
          success:true,
          message:'Contact successfully deleted.'
        });
      } else {
        res.json().then((res)=> {
          callback({
            success:false,
            message:res.message
          });
        })
      }
    }).catch((err)=>{
      callback({
        success:false,
        message:'Contact could not be deleted'
      });
      console.error(err);
    });
}

export function removeFromQuestions(contact, callback) {
  getQuestions((questions)=>{
    questions.forEach(question => {
      if (question.contact !== undefined && question.contact._id === contact._id) {
        delete question.contact;
      }
    });
    window.sessionStorage.setItem('questions', JSON.stringify(questions));
    let pre_q = window.sessionStorage.getItem('previous_question');
    if (pre_q !== null) {
      let question = JSON.parse(pre_q);
      if (question.contact !== undefined && question.contact._id === contact._id) {
        delete question.contact;
        window.sessionStorage.setItem('previous_question', JSON.stringify(question));
      }
    }
    callback();
  })
}

export function makeDepartmentOptions(departments) {
  return departments.map(dept=> {
    return {
      value:dept._id,
      label:dept.name
    }
  });
}