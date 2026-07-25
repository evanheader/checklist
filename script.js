const button = document.getElementById('demoButton');
const message = document.getElementById('message');

button.addEventListener('click', () => {
  message.textContent = 'The button worked! Your JavaScript is running.';
});
