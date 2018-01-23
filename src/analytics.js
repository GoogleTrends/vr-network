let usinganalytics = false;

window.dataLayer = window.dataLayer || []; // eslint-disable-line
function gtag () { dataLayer.push(arguments); } // eslint-disable-line

export function setupAnalytics(gatid) {
  if (gatid) {
    usinganalytics = true;
    gtag('js', new Date());
    gtag('config', gatid);
  } else {
    usinganalytics = false;
  }
}

export function sendEvent(event, category, label) {
  if (usinganalytics) {
    gtag('event', event, {
      event_category: category,
      event_label: label,
    });
  }
}
