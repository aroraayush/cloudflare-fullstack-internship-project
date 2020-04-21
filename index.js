// The following code has been tested on Safari and Firefox. It works perfectly on both.
// Brave and other Chromium related browsers gave some issues like requesting URL twice .

const API_URL = "https://cfw-takehome.developers.workers.dev/api/variants";
const COOKIE_NAME = "chosen_url";
let cntMap = new Map();
// Could have used just a single counter,
// but used map intentionally to track the counts for each URL
cntMap.set(0,0); // URL 1 Count
cntMap.set(1,0); // URL 2 Count

class ContentRewriter {
  constructor(value) {
    this.value = value
  }
  element(element) {
    element.setInnerContent(this.value);
  }
}

class InnerContentRewriter {
  constructor(){}
  text(text) {
    if (this.textChunk === null)
      this.textChunk = text.text;
    else
      this.textChunk += text.text;

    if (this.textChunk.toLowerCase().includes('variant')) {
      try {
        text.replace(text.text.replace(/Variant/gi, 'Ayush Arora -'))
      }
      catch (error) {
        console.log('error while replacing in text chunk', error)
      }
    }
    if (text.lastInTextNode) {
      this.textChunk = null
    }
  }
}

class AttributeRewriter {
  constructor(attributeName) {
    this.attributeName = attributeName
  }
  element(element) {
    element.setInnerContent("View latest code");
    const attribute = element.getAttribute(this.attributeName)
    if (attribute) {
      element.setAttribute(this.attributeName,"https://github.com/aroraayush/internship-application-fullstack/blob/master/index.js"
      )
    }
  }
}

const htmlRewriter = new HTMLRewriter()
    .on('title', new ContentRewriter("Cloudflare Submission - Ayush"))
    .on('h1#title', new InnerContentRewriter())
    .on('p#description', new ContentRewriter("Please open page in Safari or Firefox if disabling cookies !!"))
    .on('a#url', new AttributeRewriter('href'));

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

/**
 * Respond with one of the 2 urls
 * @param {Request} request
 */
async function handleRequest(request) {

  const url = new URL(API_URL);
  const cookie = getCookie(request, COOKIE_NAME);

  function getRandomURLIdx(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  function getNormalizedURLIdx(count1,count2) {
    return count1 > count2 ? 1 : 0;
  }

  try {
    const fetchURL = await fetch(url);

    if(fetchURL.status > 399){
      errorExit(await fetchURL.error());
    }
    const response = await fetchURL.json();

    if (!('variants' in response)){
      errorExit("No URLs found  in API response");
    }
    const urls = response.variants;
    const count1 = cntMap.get(0);
    const count2 = cntMap.get(1);

    // If Index found in Cookie, use that
    // Else if page loaded first time , randomly passing a URL index to serve URL
    // Else (if cookie not set) load other page with 50% probability
    const idx = cookie ? parseInt(cookie) : !count1 && !count2 ? getRandomURLIdx(2) : getNormalizedURLIdx(count1,count2);
    const varIntUrl = await fetch(new URL(urls[idx]));

    if(varIntUrl.status > 399){
      errorExit(await fetchURL.error());
    }
    cntMap.set(idx, cntMap.get(idx) + 1);
    const markup = htmlRewriter.transform(varIntUrl);
    responseBody = await markup.text();
    return new Response(responseBody, {
      headers: {
        'content-type': 'text/html',
        'Set-Cookie': setCookie(COOKIE_NAME,idx,1)
      },
    });
  }
  catch (e) {
    errorExit("Exception ",e);
  }
}
// Exits the program in case of error
function errorExit(responseBody) {
  return new Response(responseBody, {
    headers: { 'content-type': 'text/plain' },
  })
}

/**
 * Grabs the cookie with name from the request headers
 * @param {Request} request incoming Request
 * @param {string} name of the cookie to grab
 */
function getCookie(request, name) {
  let result = null
  let cookieString = request.headers.get('Cookie')
  if (cookieString) {
    let cookies = cookieString.split(';')
    cookies.forEach(cookie => {
      let cookieName = cookie.split('=')[0].trim();
      if (cookieName === name) {
        let cookieVal = cookie.split('=')[1];
        result = cookieVal
      }
    })
  }
  return result
}

// Sets cookie
function setCookie(name, value, days) {
  var d = new Date;
  d.setTime(d.getTime() + 24*60*60*1000*days);
  return (name + "=" + value + ";path=/;expires=" + d.toGMTString());
}