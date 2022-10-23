import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

async function showToast(msg) {
  Toastify({
    backgroundColor: 'black',
    gravity: 'bottom', // `top` or `bottom`
    position: 'center', // `left`, `center` or `right`
    text: msg
  }).showToast();
}

async function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  })
}

// async function getLogger() {
//   return console;
// }

async function getStorageValue(key) {
  const val = window.localStorage.getItem(key);
  return val;
}

async function setStorageValue(key, val) {
  window.localStorage.setItem(key, val);
}

async function clearStorageValue() {
  window.localStorage.clear();
}

function openUrl(url) {
  const win = window.open(url, '_blank');
  win.focus();
}

function remainingText(seconds) {
  let secs = seconds;
  let numDays = Math.floor(secs / (3600 * 24));
  secs = secs - (numDays * 3600 * 24);
  let numHours = Math.floor(secs / 3600);
  secs = secs - (numHours * 3600);
  let numMinute = Math.floor(secs / 60);
  secs = secs - (numMinute * 60);
  let numSeconds = secs;
  let ret = '';
  if (numDays > 0) ret += (numDays + ' days ');
  if (numHours > 0) ret += (numHours + ' hours ');
  if (numMinute > 0) ret += (numMinute + ' minutes ');
  if (numSeconds > 0) ret += (numSeconds + ' seconds');
  return ret;
}

export default {
  delay,
  openUrl,
  showToast,
  getStorageValue,
  setStorageValue,
  clearStorageValue,
  remainingText
};

