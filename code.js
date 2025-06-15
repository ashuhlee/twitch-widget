// global state object
let state = {
  "goal": {
    "value": 0,
    "type": "follower",
    "duration": "total"

  },
  "currency": "" // store currency symbol for donation goal
};

// Runs code on widget load
window.addEventListener('onWidgetLoad', async function (obj) {
  console.log("Widget loaded:", obj);
  let data = obj.detail.session.data;
  let fieldData = obj.detail.fieldData;
  state.goal.value = fieldData.goal_total;
  state.goal.type = fieldData.goalType; // get the goal type from field data
  state.goal.duration = fieldData.data_duration;
  state.currency = fieldData.curr; // get the currency symbol from field data
  updateProgress(data);

  let isEditor = await SE_API.getOverlayStatus();
  console.log("IS THIS EDITOR MODE:", isEditor.isEditorMode);

});

window.addEventListener('onSessionUpdate', function (obj) {
  console.log("Session updated:", obj);
  let data = obj.detail.session;
  updateProgress(data);
});

// counter animation function
function animateCounter(element, start, end, duration, isDonation, currency) {
  let startTime = null;

  function updateCounter(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = currentTime - startTime;
    const increment = Math.min(progress / duration, 1);
    const value = Math.floor(increment * (end - start) + start);
    element.textContent = isDonation ? currency + value : value;

    if (progress < duration) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = isDonation ? currency + end : end;
    }
  }
  requestAnimationFrame(updateCounter);
}


// progress function
function updateProgress(data) {
  console.log("Updating progress with data:", data);
  
  const fill = document.querySelector("#fill");
  const fillOverlay = document.querySelector("#overlay");
  
  const goalCount = document.querySelector("#goal-count");
  const goalEnd = document.querySelector("#goalEnd");
  const maxWidth = 85 + fillOverlay.getBoundingClientRect().width;

  let count = 0;

if (state.goal.type === "follower") {
  let key = `follower-${state.goal.duration}`;
  count = data[key]?.count ?? 0;
}

  else if (state.goal.type === "subscriber") {
  let key = `subscriber-${state.goal.duration}`;
  count = data[key]?.count ?? 0;
}
  
  else if (state.goal.type === "donation") {
  let key = `tip-${state.goal.duration}`;
  count = data[key]?.amount ?? 0;
}
  
  else if (state.goal.type === "bit") {
  let key = `cheer-${state.goal.duration}`;
  count = data[key]?.amount ?? 0;
}
    
  if (count !== undefined) {
    let p = (count / state.goal.value) * maxWidth;
    if (count >= state.goal.value) {
      p = maxWidth; // make sure p is set to maxWidth when count reaches goal value
      goalCount.classList.add('goal-animation'); // add animation class when count reaches goal value
    } else {
      goalCount.classList.remove('goal-animation'); // remove animation class when count is not at goal value
    }
    console.log("Progress width:", p, "Count:", count);

    // get the current value displayed
    let currentValue = parseInt(goalCount.textContent.replace(state.currency, '')) || 0;

    // check if the goal type is donation
    let isDonation = state.goal.type === "donation";
    let currency = state.currency || '';

    // animate the counter from the current value to the new count
    animateCounter(goalCount, currentValue, count, 1000, isDonation, currency); // 1000ms for 1 second animation

    fill.style.width = p + 'px';
  } else {
    console.error("Goal count data is missing for type:", state.goal.type);
    console.log('Received data:', data);
  }
}

// function to dispatch a custom goal event
function simulateGoalEvent() {
  const randomCount = Math.floor(Math.random() * state.goal.value);
  let goalKey = `${state.goal.type}-total`;
  let goalEventData = {
    [goalKey]: {
      "count": randomCount
    }
  };

  if (state.goal.type === "donation") {
    goalEventData = {
      "donation-total": {
        "amount": randomCount
      }
    };
  } else if (state.goal.type === "bit") {
    goalEventData = {
      "cheer-total": {
        "amount": randomCount
      }
    };
  }

  const goalEvent = new CustomEvent("onSessionUpdate", {
    detail: {
      session: {
        data: goalEventData
      }
    }
  });
  console.log(`Dispatching simulated ${state.goal.type} event with count:`, randomCount);
  window.dispatchEvent(goalEvent);
}
