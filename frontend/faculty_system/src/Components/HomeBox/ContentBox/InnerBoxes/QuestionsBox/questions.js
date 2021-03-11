
// export class Question {
//     constructor(id, name, patterns, entities, responses) {

//     }
// }




export function getQuestions(callback) {

  let qfs = window.sessionStorage.getItem('questions'); // qfs = Questions From Storage, used to grab the string before parsing to JSON
  if (qfs === null) {
    let options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': window.sessionStorage.getItem('token')
        },
    };

    fetch('http://127.0.0.1:5000/api/faculty/get_questions', options)
      .then((res)=> {
          if (res.status === 401) {
            res.json().then((res)=> alert(res['message']));
            callback([]);
          } else if (res.status === 200) {
            res.json().then((res)=> {
                console.log(res['questions']);
                window.sessionStorage.setItem('questions', JSON.stringify(res['questions']))
                callback(res['questions']);
            });
          }
      })
      .catch((err) => {
        alert('Failed to retrieve questions.');
        console.log('error occurred', err);
        callback([]);
      });
  } else {
    callback(JSON.parse(qfs));
  }
}