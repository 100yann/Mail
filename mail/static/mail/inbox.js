document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recepient = null, subject = null) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-single-email').style.display = 'none';
  
  // Clear out composition fields
  if (recepient && subject){
    document.querySelector('#compose-recipients').value = recepient;
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
  } else {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';

  }
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
  document.querySelector('#view-single-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  let ulElement = document.querySelector('#emails-view')
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      if (mailbox === 'inbox') {
        person = email.sender;
      } else if (mailbox === 'sent') {
        person = emails.recepients
      };

      const { subject, timestamp, read, id } = email;

      const element = document.createElement('div');
      element.className = 'email-line'

      // check if email is read
      if (read){
        element.classList.add('read');
      }

      element.innerHTML = `
        <div class="email-line-left">
          <div class="sender">
            <p><strong>${person}</strong></p>
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

      // add event listener for each listed email
      element.addEventListener('click', () => {
        display_email(id)
      })

    });
  })
  .catch(error => {
    console.error('Error fetching emails: ', error)
  })
};


// display selected email
function display_email(emailId){
  // get the data for the selected email
  fetch(`emails/${emailId}`)
  .then(response => response.json())
  .then(data => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#view-single-email').style.display = 'block';

    document.querySelector('#view-single-email').innerHTML = `
      <p><strong>From: </strong>${data.sender}</p>
      <p><strong>To: </strong>${data.recipients}</p>
      <p><strong>Subject: </strong>${data.subject}</p>
      <p><strong>Timestamp: </strong>${data.timestamp}</p>
      <button id="reply" class="btn btn-primary">Reply</button>
      <hr>
      <p>${data.body}</p>
    `;
    const reply = document.querySelector('#reply')
    reply.addEventListener('click', () => {
      compose_email(recepient=data.recipients, subject=data.subject)

    });
  })
}
