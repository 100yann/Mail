document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () => {
    const recepient = document.querySelector('#compose-recipients').value
    const subject = document.querySelector('#compose-subject').value
    const body = document.querySelector('#compose-body').value
    
    // Clear form fields
    document.querySelector('#compose-recipients').value = ''
    document.querySelector('#compose-subject').value = ''
    document.querySelector('#compose-body').value = ''

    // Make POST request
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recepient,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });

    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  let ulElement = document.querySelector('#emails-view')
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    Object.keys(emails).forEach(key => {
      if (mailbox === 'inbox') {
        email = emails[key]['sender'];
      } else if (mailbox === 'sent') {
        email = emails[key]['recipients']
      };
      subject = emails[key]['subject']
      timestamp = emails[key]['timestamp']
      const element = document.createElement('div');
      element.className = 'email-line'
      console.log(emails[key])
      // check if email is read
      if (emails[key]['read'] === true){
        element.className += ' read'
      }

      element.href = `/emails/${emails[key]['id']}`
      element.innerHTML = `
        <div class="email-line-left">
          <div class="sender">
            <p><strong>${email}</strong></p>
          </div>
          <div class="subject">
            <p>${subject}</p>
          </div>
        </div>
        <div class="email-line-right">
          <p>${timestamp}</p>
        </div>
      `;
      ulElement.append(element)
      element.addEventListener('click', () => {
        const emailId = emails[key]['id'];
        console.log(emailId)
      })
    })
  });
}