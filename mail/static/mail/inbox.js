document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


let emailData = {
  sender: '',
  recipient: '',
  subject: '',
  body: '',
  timestamp: ''
}

function compose_email(is_reply=false) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-single-email').style.display = 'none';
  

  // If compose is reply
  if (is_reply === true){

    // Check if Re: is already in the subject
    if (emailData.subject.slice(0,3) != 'Re:'){
      subject = `Re: ${emailData.subject}`
    } else {
      subject = emailData.subject
    }

    // Add data to fields
    document.querySelector('#compose-recipients').value = emailData.sender;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `On ${emailData.timestamp}, ${emailData.sender} wrote:\n'${emailData.body}'`;
    document.querySelector('#compose-body').focus()

  // If compose is a new email
  } else {

    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

  }
  

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
        person = email.sender
      } else if (mailbox === 'sent') {
        person = email.recipients
      }

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

      // Add event listener for each listed email
      element.addEventListener('click', () => {
        readEmail(id, emailProperty='read')
        display_email(id)
      })
    });
  })
  .catch(error => {
    console.error('Error fetching emails: ', error)
  })
};


// Display selected email
function display_email(emailId){
  // Get the data for the selected email
  fetch(`emails/${emailId}`)
  .then(response => response.json())
  .then(data => {
    emailData.sender = data.sender
    emailData.recipient = data.recipients;
    emailData.subject = data.subject;
    emailData.body = data.body;
    emailData.timestamp = data.timestamp;

    // display the single email and hide the list of emails
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#view-single-email').style.display = 'block';

    if (data.archived === true){
      var archiveButton = 'Unarchive'
    } else {
      var archiveButton = 'Archive'
    }

    document.querySelector('#view-single-email').innerHTML = `
      <p id='from'><strong>From: </strong>${emailData.sender}</p>
      <p><strong>To: </strong>${emailData.recipient}</p>
      <p id='subject'><strong>Subject: </strong>${emailData.subject}</p>
      <p id='timestamp'><strong>Timestamp: </strong>${emailData.timestamp}</p>
      <button id="reply" class="btn btn-primary">Reply</button>
      <button id="archive" class="btn btn-primary">${archiveButton}</button>
      <hr>
      <p id='body'>${emailData.body}</p>
    `;

    const reply = document.querySelector('#reply')
    reply.addEventListener('click', () => {
      compose_email(is_reply=true)
    });
    const archive = document.querySelector('#archive')
    archive.addEventListener('click', () =>{
      if (data.archived === true){
        readEmail(emailId, 'archive', false)
      } else {
        readEmail(emailId, 'archive', true)
      }
    })
  })
}

function readEmail(emailId, emailProperty, status=false){
  // read email
  if (emailProperty === 'read'){
    fetch(`emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
        'read': true
      })
    })
  // archive email  
  } else if (emailProperty === 'archive'){
    fetch(`emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
        'archived': status
      })
    }).then(response => {
      if(response.ok) {
        load_mailbox('inbox')
      }
    })
  }
}
