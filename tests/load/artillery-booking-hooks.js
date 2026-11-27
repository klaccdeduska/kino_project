const waiting = [];
let timeout;

function waitForAllUsers(_context, _events, done) {
  waiting.push(done);
  if (waiting.length === 1) {
    timeout = setTimeout(() => {
      const error = new Error('Twenty booking users did not reach the barrier');
      for (const release of waiting.splice(0)) release(error);
    }, 5000);
  }

  // Artillery assigns the entire fixed-count phase to one local worker.
  if (waiting.length === 20) {
    clearTimeout(timeout);
    for (const release of waiting.splice(0)) release();
  }
}

module.exports = { waitForAllUsers };
