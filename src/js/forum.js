import ky from "ky";
import $ from "jquery";
import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";

function secure(content) {
  return $(`<div>${content}</div>`).text();
}

function formatDate(timestamp) {
  // return format(new Date(timestamp), "d MMMM Y à H:mm", { locale: fr });
  return formatDistance(new Date(timestamp), new Date(), {
    addSuffix: true,
    locale: fr
  });
}

function getMessageView(message) {
  try {
    return `<div class="card my-3">
      <div class="card-body">
        <p class="card-text">${secure(message.content)}</p>
      </div>
      <div class="card-footer text-muted text-right">
        Par ${secure(message.author)}, ${formatDate(message.timestamp)}
      </div>
    </div>`;
  } catch {
    return "";
  }
}

function displayMessages(messages) {
  const $messagesContainer = $(".messages-container");

  // Clear list content on view
  $messagesContainer.empty();

  // Iterate on messages and display getMessageView(message);
  messages.forEach(message => {
    $messagesContainer.prepend(getMessageView(message));
  });
}

async function refreshMessages() {
  // GET https://ensmn.herokuapp.com/messages
  let messages = [];
  let pageIndex = 1;
  let finished = false;

  while (!finished) {
    const pageMessages = await ky
      .get(`https://ensmn.herokuapp.com/messages?page=${pageIndex}`)
      .json();
    pageIndex += 1;

    // Concatenate messages
    messages = messages.concat(pageMessages);

    // Is finished ?
    finished = pageMessages.length < 10;
  }

  displayMessages(messages);
}

setInterval(() => {
  refreshMessages();
}, 10000);

refreshMessages();

async function sendMessage(username, message) {
  // POST https://ensmn.herokuapp.com/messages (username, message)
  await ky.post("https://ensmn.herokuapp.com/messages", {
    json: {
      username,
      message
    }
  });

  // After success, getMessages()
  await refreshMessages();
}

$("body").on("submit", "#message-form", event => {
  // Prevent page refresh
  event.preventDefault();

  const $author = $("#author");
  const $message = $("#message");

  const author = $author.val();
  const message = $message.val();

  if (author == null || author.length === 0) {
    return;
  }

  if (message == null || message.length === 0) {
    return;
  }

  sendMessage(author, message);

  $author.val("");
  $message.val("");
});
