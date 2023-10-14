
document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  
  // Highlhight current page
  const pageButtons = document.querySelectorAll('.btn-sm')
  var currentClicked = null
  pageButtons.forEach((element) => {
    element.addEventListener('click', () =>{
      if (currentClicked){
        currentClicked.style.opacity = 1
      }
      element.style.opacity = 0.5
      currentClicked = element
  })
});
  // By default, load the inbox
  load_mailbox('inbox');
});


// Allow going back/forwards in the browser
window.addEventListener('popstate', event => {
  if (event.state === 'null' || event.state.mailbox === 'inbox'){
    load_mailbox('inbox')
  } else if (event.state.mailbox === 'sent'){
    load_mailbox('sent')
  } else if (event.state.mailbox === 'archive'){
    load_mailbox('archive')
  } else if (event.state.mailbox === 'email'){
    display_email(event.state.emailId)
  } else if (event.state.mailbox === 'compose'){
    compose_email()
  }
})

// Used to access data without having to pass it from function to function
let emailData = {
  sender: '',
  recipient: '',
  subject: '',
  body: '',
  timestamp: ''
}


// Compose new email
function compose_email(is_reply=false) {

  var historyData = {mailbox: 'compose'}
  // If function call comes from going back to 'Compose' don't pushState again
  if (!window.history.state || window.history.state.mailbox !== 'compose') {
    history.pushState(historyData, '', 'compose');
  }

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
    .then(response => {
      if (response.status === 201){
        document.querySelectorAll('.form-control').forEach((element) => {
          element.style.animationPlayState = 'running';
        })
        var alertBox = document.getElementById("custom-alert");
        alertBox.style.display = "block";
    
        setTimeout(function() {
            alertBox.style.display = "none";
        }, 3000);
        return response.json()
      }
    })
    .then(result => {
        // Print result
        console.log(result)
    });

    return false;
  }
}

function load_mailbox(mailbox) {

  var historyData = {mailbox: mailbox}
  // If function call comes from going back to 'Mailbox' don't pushState again
  if (!window.history.state || window.history.state.mailbox !== `${mailbox}`) {
    history.pushState(historyData, '', `${mailbox}`);
  }

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-single-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Keep track of num of unread emails
  let unread = 0
  let ulElement = document.querySelector('#emails-view')

  // Send GET request to get all emails for the specified mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Iterate through all returned emails
    emails.forEach(email => {
      // If mailbox is inbox or archive display the sender
      if (mailbox === 'inbox' || mailbox ==='archive') {
        person = email.sender
      // If mailbox is sent display the recipient
      } else if (mailbox === 'sent') {
        person = email.recipients
      }

      const { subject, timestamp, read, id } = email;

      const element = document.createElement('div');
      element.className = 'email-line'

      // check if email is read
      if (read){
        element.classList.add('read');
      // if email isn't read update the unread count
      } else {
        unread += 1
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
        // If email is clicked update the unread count
        unread -= 1

        var historyData = {mailbox: 'email', emailId: id}
        history.pushState(historyData, '', `view=${id}`)
        // Update email to read
        readEmail(id, emailProperty='read')

        // Display only the clicked on email on page
        display_email(id, mailbox)

        // Update how many emails are unread in the Inbox button
        updateUnreadCount(unread)
      })
    });
  }).then(() => {
    // Update how many emails are unread in the Inbox button 
    updateUnreadCount(unread)
  })
  .catch(error => {
    console.error('Error fetching emails: ', error)
  })
};


// Display Unread Count in Inbox button
function updateUnreadCount(unread){
  const inbox = document.querySelector('#inbox')

  if (unread > 0){
    inbox.textContent = `Inbox (${unread})`
  } else {
    inbox.textContent = `Inbox`
  }
}

// Display selected email
function display_email(emailId, mailbox){
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
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#view-single-email').style.display = 'block';

    if (data.archived === true){
      var archiveButton = 'Unarchive'
    } else {
      var archiveButton = 'Archive'
    }

    const condition = (mailbox != 'sent');
    // If mailbox is inbox or archive - display Archive button
    // if mailbox is sent - don't display Archive button
    document.querySelector('#view-single-email').innerHTML = `
      <p id='from'><strong>From: </strong>${emailData.sender}</p>
      <p><strong>To: </strong>${emailData.recipient}</p>
      <p id='subject'><strong>Subject: </strong>${emailData.subject}</p>
      <p id='timestamp'><strong>Timestamp: </strong>${emailData.timestamp}</p>
      <button id="reply" class="btn btn-primary">Reply</button>
      ${condition ? `<button id="archive" class="btn btn-primary">${archiveButton}</button>` : ''}
      <button id="delete" class="btn btn-primary">Delete</button>
      <hr>
      <p id='body'>${emailData.body}</p>
      `;

    // Add event listener to reply button
    const reply = document.querySelector('#reply')
    reply.addEventListener('click', () => {
      // Call compose email
      compose_email(is_reply=true)
    });

    const del_email = document.querySelector('#delete')
    del_email.addEventListener('click', () => {
      fetch(`emails/${emailId}`, {
        method: 'DELETE'
      }).then(load_mailbox(mailbox))
    });

    // Add event listener to archive button
    if (mailbox != 'sent'){
      const archive = document.querySelector('#archive')
      archive.addEventListener('click', () =>{
        if (data.archived === true){
          readEmail(emailId, 'archive', false)
        } else {
          readEmail(emailId, 'archive', true)
        }
      })
    }
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
        // Reload inbox
        load_mailbox('inbox')
      }
    })
  }
}
