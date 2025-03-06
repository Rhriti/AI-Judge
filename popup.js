import YoutubeTranscript from "./youtube_transcript.js";



document.addEventListener('DOMContentLoaded', function () {
 
  const openaiPricing = {
    "gpt-4o": { input: 2.5, output: 10.0 },
    "gpt-4o-2024-08-06": { input: 2.5, output: 10.0 },
    "gpt-4o-2024-11-20": { input: 2.5, output: 10.0 },
    "gpt-4o-2024-05-13": { input: 5.0, output: 15.0 },
    "gpt-4o-audio-preview": { input: 2.5, output: 10.0 },
    "gpt-4o-audio-preview-2024-12-17": { input: 2.5, output: 10.0 },
    "gpt-4o-audio-preview-2024-10-01": { input: 2.5, output: 10.0 },
    "gpt-4o-realtime-preview": { input: 5.0, output: 20.0 },
    "gpt-4o-realtime-preview-2024-12-17": { input: 5.0, output: 20.0 },
    "gpt-4o-realtime-preview-2024-10-01": { input: 5.0, output: 20.0 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4o-mini-2024-07-18": { input: 0.15, output: 0.6 },
    "gpt-4o-mini-audio-preview": { input: 0.15, output: 0.6 },
    "gpt-4o-mini-audio-preview-2024-12-17": { input: 0.15, output: 0.6 },
    "gpt-4o-mini-realtime-preview": { input: 0.6, output: 2.4 },
    "gpt-4o-mini-realtime-preview-2024-12-17": { input: 0.6, output: 2.4 },
    "o1": { input: 15.0, output: 60.0 },
    "o1-2024-12-17": { input: 15.0, output: 60.0 },
    "o1-preview-2024-09-12": { input: 15.0, output: 60.0 },
    "o3-mini": { input: 1.1, output: 4.4 },
    "o3-mini-2025-01-31": { input: 1.1, output: 4.4 },
    "o1-mini": { input: 1.1, output: 4.4 },
    "o1-mini-2024-09-12": { input: 1.1, output: 4.4 },
    "gpt-4o-2024-08-06 (fine-tuning)": { input: 3.75, output: 15.0 },
    "gpt-4o-mini-2024-07-18 (fine-tuning)": { input: 0.3, output: 1.2 },
    "gpt-3.5-turbo": { input: 3.0, output: 6.0 },
    "davinci-002": { input: 12.0, output: 12.0 },
    "babbage-002": { input: 1.6, output: 1.6 },
    "chatgpt-4o-latest": { input: 5.0, output: 15.0 },
    "gpt-4-turbo": { input: 10.0, output: 30.0 },
    "gpt-4-turbo-2024-04-09": { input: 10.0, output: 30.0 },
    "gpt-4-0125-preview": { input: 10.0, output: 30.0 },
    "gpt-4-1106-preview": { input: 10.0, output: 30.0 },
    "gpt-4-1106-vision-preview": { input: 10.0, output: 30.0 },
    "gpt-4": { input: 30.0, output: 60.0 },
    "gpt-4-0613": { input: 30.0, output: 60.0 },
    "gpt-4-0314": { input: 30.0, output: 60.0 },
    "gpt-4-32k": { input: 60.0, output: 120.0 },
    "gpt-3.5-turbo-0125": { input: 0.5, output: 1.5 },
    "gpt-3.5-turbo-1106": { input: 1.0, output: 2.0 },
    "gpt-3.5-turbo-0613": { input: 1.5, output: 2.0 },
    "gpt-3.5-0301": { input: 1.5, output: 2.0 },
    "gpt-3.5-turbo-instruct": { input: 1.5, output: 2.0 },
    "gpt-3.5-turbo-16k-0613": { input: 3.0, output: 4.0 }
};
  const submitBtn = document.getElementById('submitBtn');
  const apiInput = document.getElementById("api");
  const prizeInput = document.getElementById('text');

 
  let link = null;
  let currentController = null;

  async function Check(url) {
    link = url;
  
  if (currentController) {
    currentController.abort(); 
  }

  const controller = new AbortController();
  const signal = controller.signal;
  currentController = controller; 

  link = url;
  const regex_url = /https:\/\/([^.]+)\.devpost\.com/;
  const matchs = url.match(regex_url);

  if (matchs) {
    const project_gallery_link = 'https://' + matchs[1] + '.devpost.com/project-gallery';
    console.log(project_gallery_link);

    try {
      // Race the fetch request against the abort signal
      const response = await Promise.race([
        chrome.runtime.sendMessage({ action: 'fetch', url: project_gallery_link, signal }),
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('Request cancelled'));
          });
        })
      ]);

      // this is very rare case wherer content is fetched but tabs are switched (aborted)
      // we are now on a different page and don't want the earlier results 
      //so we don't go ahead
      if (signal.aborted) {
        console.log('Request was aborted:', project_gallery_link);
        return;
      }

      // Process the response
      const html = response.data;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const x = doc.querySelectorAll('#submission-gallery [data-software-id] a');
      if (x.length === 0) {
        submitBtn.classList.add('busy');
        submitBtn.style.background = "#f0d7d7";
      } else {
        submitBtn.classList.remove('busy');
        submitBtn.style.background = "#d7f0d7";
      }
    } catch (error) {
      if (error.message === 'Request cancelled') {
        submitBtn.classList.add('busy');
        submitBtn.style.background="#f0d7d7"
        return;
      }

    }
  } else {
    submitBtn.classList.add('busy');
    submitBtn.style.background = "#f0d7d7";
  }

  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      let url = tabs[0].url;
      if (url) { Check(url); }    
    }
  });
  
  chrome.storage.local.get(["api"], function (data) {
    // Check if data exists and populate fields
    if (data.api) {
      apiInput.value = data.api;
      fetchModels()
    }
  });

  let timeout = null;
  
  apiInput.addEventListener("input", function () {
    clearTimeout(timeout);
    timeout=setTimeout(() => {
      fetchModels();
    }, 500);
  });
  
 
  async function fetchModels() {
   
    const apiKey = document.getElementById('api').value.trim(); 
    const modelDropdown = document.getElementById("modelDropdown");
    const loading = document.getElementById("loading");
    
    if (!apiKey) {
        modelDropdown.style.display = "none";
        loading.style.display = "none";
        return;
    }
    
    loading.style.display = "block";
    modelDropdown.style.display = "none";

    let endpoint = null;
    if (apiKey.startsWith('sk-proj')) { endpoint = "https://api.openai.com/v1/models" }
    if (apiKey.startsWith('sk-or')) { endpoint = "https://openrouter.ai/api/v1/models" }


    try {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Invalid API Key or request failed.");
        }
        
        const data = await response.json();
        const models = data.data.map(model => model.id);
        
        modelDropdown.innerHTML = "";
        models.forEach(model => {
          const option = document.createElement("option");
         
            option.textContent = model;
            modelDropdown.appendChild(option);
        });
        
        loading.style.display = "none";
        modelDropdown.style.display = "block";
    } catch (error) {
        loading.style.display = "none";
    }
  }
  
  const triggerError = () => {
    console.log('trigger error called');
    submitBtn.classList.add('error');
    setTimeout(() => {
      submitBtn.classList.remove('error');
    }, 1500);
  };
  
  async function fetch_project_links(stop_process) {
    let project_links = [];
    const regex_url = /https:\/\/([^.]+)\.devpost\.com/;
    const matchs = link.match(regex_url);
    const baseUrl = `https://${matchs[1]}.devpost.com/project-gallery?page=`;
  
    const maxConcurrentPages = 10;
    let page = 1;
    let endReached = false;
  
    try {
      while (!stop_process && !endReached) {
        const fetchPromises = Array.from({ length: maxConcurrentPages }, (_, i) => {
          const pageNum = page + i;
          return chrome.runtime.sendMessage({ action: 'fetch', url: `${baseUrl}${pageNum}` })
            .then(response => {
              const html = response.data;
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const descriptions = Array.from(doc.querySelectorAll('#submission-gallery [data-software-id] a')).map(link => link.href);
  
              // Check if pagination exists; if not, set endReached to true
              const curr_page_element = doc.querySelector('.pagination .current a');
              if (!curr_page_element) {
                endReached = true; // No more pages to fetch
              }
  
              return descriptions;
            })
            .catch(err => {
              console.log(`Error fetching page ${pageNum}:`, err);
              return [];
            });
        });
  
        const results = await Promise.all(fetchPromises);
        results.forEach(links => project_links.push(...links));
  
        page += maxConcurrentPages;
      }
  
    } catch (error) {
      console.log('Unable to fetch projects; try again!', error);
    }
  
    console.log(project_links);
    return project_links;
  }

  async function fetch_project_description(url) {
    
    const response = await chrome.runtime.sendMessage({ action: 'fetch', url: url });
    const html = response.data;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const iframe = doc.querySelectorAll("iframe")[1];
  
    if (iframe) {
        const src = iframe.src;
    
        // Extract video ID using regex
        const match = src.match(/youtube\.com\/embed\/([^?]+)/);
        if (match && match[1]) {
            const videoId = match[1];
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
            console.log("Extracted Video ID:", videoId);
            try {
         
              const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl); // Replace with an actual video ID
         
                let subtitle = ''
              for (let i = 0; i < transcript.length; i += 1) {
                subtitle += transcript[i]['text'] + ' '
              }
              //console.log(subtitle);
                return subtitle;
            } catch (error) {
              console.log('no description');
                return "no description available";
            }
            
        } else {
            console.log("no description");
          return "no description available";
        }
    } else {
        console.log("No description");
      return "no description available";
    }

}

  async function Winner(link1, link2,  prize, api, modelname) {
    const des1 = await fetch_project_description(link1);
    const des2 = await fetch_project_description(link2);
    
    const openai_endpoint = "https://api.openai.com/v1/chat/completions";
    const openrouter_endpoint= "https://openrouter.ai/api/v1/chat/completions";
    
    const message= [
      {
          "role": "system",
          "content": `You are a hackathon judge. You will be given the hackathon requirements (what needs to be built)
          and prize criteria under which you need to declare a winner. You will then be given descriptions of two 
          projects along with their links.if anyone of the projects has no description return the other which has a project description. incase none of them have any description return any one of them.give output strictly in JSON format as shown below.
  
          ### SAMPLE OUTPUT
          {"Prize criteria": "Best Real-World App","Winner": "https://devpost.com/software/deverywhere","Reason": "justify the winner with chain of thoughts"}`
      },
      {
          "role": "user",
          "content": `
          The prize criteria under which you need to select the winner is: "Best Real-World App"
          ###
  
          Here is the overview of the first project:
          {
            "link": "https://devpost.com/software/wheely-wonka",
            "description": "Hi everyone, my name is Nico, and this is Spence GPT, my submission for the Google Chrome 
            Built-in AI Challenge. LLMs are known for their most boring use case: chatbots. But beyond that, 
            LLMs can do so much more. With prompt engineering, we can tweak each interaction exactly the way we want it, 
            and we can even achieve things like function calling, where the LLM decides if it is time to trigger a certain function. 
            Unfortunately, the prompt API is not yet ready to do classic function calling. But that got me thinking: 
            Can we achieve function calling with only a very structured way of prompt engineering? Turns out we can. 
            With Ben GPT, I wanted to create a car that I can actually talk to. At its core, I am using the Web Speech API and 
            also the Speech Synthesis API. With the Web Bluetooth API, I created a car that can be controlled with Ben GPT. 
            This project connects many browser APIs together and tests the limits of what is possible, inspiring creativity."
          }
          ###
  
          Here is the overview of the second project:
          {
            "link": "https://devpost.com/software/deverywhere",
            "description": "Hello everyone, my name is Joe, and for this hackathon, I created the Doagram Chrome extension. 
            It uses Chrome's built-in AI to create highly interactive diagrams of the concepts on the page you're looking at. 
            First, the extension breaks the web page into sections and passes each section to the Summary API, which creates a summary. 
            Then, I pass the summary to the Prompt API, which generates relationships between entities, and convert those into mermaid diagrams..."
          }`
      },
      {
          "role": "assistant",
          "content": `{
            "Prize criteria": "Best Real-World App","Winner": "https://devpost.com/software/deverywhere","Reason": "BenzGPT utilizes the Speech-to-Text API to understand voice commands and uses the Prompt API to trigger functions for controlling a virtual animated car. It also employs Text-to-Speech for feedback. While it is creative, it primarily serves as a recreational project without addressing a specific real-world problem. In contrast, Doagram creates flow diagrams from web page content, making it useful for individuals who prefer learning visually. Given its practical applications, Doagram is the winner for the 'Best Real-World App' category."}`
      },
      {
          "role": "user",
          "content": `
          The prize criteria under which you need to select the winner is:
          ###
          ${prize}
          ###
  
          Here is the overview of the first project:
          {
            "link": "${link1}",
            "description": "${des1 || "no description"}"
          }
          ###
  
          Here is the overview of the second project:
          {
            "link": "${link2}",
            "description": "${des2 || "no description"}"
          }`
    }];
  
    const message_openrouter = [
    {
      "role": "system",
      "content": `You are a hackathon judge. You will instructed what to build and prize criteria under which you need to declare a winner. You will then be given descriptions of two 
      projects along with their links.if anyone of the projects has no description return the other which has a project description. incase none of them have any description return any one of them. return output in JSON markdown format. the json must adhere to this schema :{"Prize criteria": "Best Real-World App","Winner": "https://devpost.com/software/deverywhere","Reason": "justify the winner over the other"}`
    },
    {
      role: "user",
      content: `
          The prize criteria under which you need to select the winner is:
          ###
          ${prize}
          ###
  
          Here is the overview of the first project:
          {
            "link": "${link1}",
            "description": "${des1 || "no description available"}"
          }
          ###
  
          Here is the overview of the second project:
          {
            "link": "${link2}",
            "description": "${des2 || "no description available"}"
          }`
    }
  ];
  
    const requestbody_openai = {
    model: modelname, // Replace with your desired model
    temperature: 0.7,
    top_p: 1,
    stream: false,
    messages: message, // Ensure this is an array of message objects
    presence_penalty: 0,
    frequency_penalty: 0,
    n: 1
  };
  
    const requestbody_openrouter = {
      "model": modelname,
      "messages": message_openrouter, 
  };

    let response = null;
    if (api.startsWith('sk-proj')) {
      response = await chrome.runtime.sendMessage({ action: 'OpenAI', url: openai_endpoint, apiKey: api, payload: requestbody_openai })
    }
    
    if (api.startsWith('sk-or')) {
      response = await chrome.runtime.sendMessage({ action: 'OpenRouter', url: openrouter_endpoint, apiKey: api, payload: requestbody_openrouter });
    }
    //console.log('resposne', response);
    return response;
  }


  function createResultTile(winner, loser, reason) {
    let tile = document.createElement("div");
    tile.className = "outer-box";
    tile.innerHTML = `
        <div class="box-row">
          <div class="box-item green-border">${winner.match(/[^/]+$/)[0]}</div>
          <div class="box-item red-border">${loser.match(/[^/]+$/)[0]}</div>
        </div>
        <div class="winner-text">Winner : ${winner.match(/[^/]+$/)[0]}</div>
        <div class="extra-info">
          ${reason}
        </div>
    `;
    return tile;
}


submitBtn.addEventListener('click', async () => {
  const prize = prizeInput.value;
  const api = apiInput.value;
  const loader = document.getElementById("loader");
  const container = document.getElementById("tilesContainer");
  const stopIcon = document.getElementById('stop-icon');
  const dropdown = document.getElementById("modelDropdown");

  if (submitBtn.classList.contains('busy') || submitBtn.style.background=="#f0d7d7") {
    triggerError()
    return;
  } 

  if (!prize || !api ) {
    alert('Please fill in all fields');
    return;
  }
  
  submitBtn.classList.add('busy');
  let stop_process = false;

  const elements = document.querySelectorAll('.outer-box'); 
  elements.forEach(element => {
    element.remove(); 
  });

  loader.style.display = "block";
  stopIcon.style.display = "inline-block";
  stopIcon.addEventListener("click", function () {
    loader.style.display = "none"; //instantly remove the loader 
    stop_process = true;
  });

  const selectedValue = dropdown.value;
  
  chrome.storage.local.set({
    api: api,
  });

  if (stop_process) { submitBtn.classList.remove('busy'); return; }    
  const project_links = await fetch_project_links(stop_process); 
  if (stop_process) { submitBtn.classList.remove('busy'); return; }
  
  if (project_links.length == 0) {submitBtn.classList.remove('busy'); loader.style.display = "none";return; }
  
  let winner = project_links[0];


  let initial_usage = null;
  let total_cost = 0;
  if (api.startsWith('sk-or')) {
    initial_usage = await chrome.runtime.sendMessage({ action: 'usage', apiKey: api });
  } 

  //IMP 1v1
  //suggest me better and robust battles
  for (let i = 1; i < project_links.length; i += 1){  
    if (stop_process) { break; }
    let old_winner = winner;
    winner = await Winner(project_links[i], winner, prize, api, selectedValue);
    let resultTile = null;
    
    if ("error" in winner) { 
      resultTile = createResultTile(old_winner, project_links[i], 'Invalid api response; skipping current contendor ; proceeding with previous winner');
      winner = old_winner;

    } else {
      if (api.startsWith('sk-proj') && selectedValue in openaiPricing) {
        total_cost += (winner.input * Math.pow(10, -6)) * openaiPricing[selectedValue].input + (winner.output * Math.pow(10, -6)) * openaiPricing[selectedValue].output;
        console.log('current cost', total_cost);
      }

      winner = winner.data;
      if (winner['Winner'] == old_winner) { old_winner = project_links[i]; }
      resultTile = createResultTile(winner['Winner'], old_winner, winner['Reason']);
      winner = winner['Winner'];    
    }


    resultTile.addEventListener("click", function () {
              const extraInfo = this.querySelector('.extra-info');
              if (parseInt(getComputedStyle(extraInfo).height) > 0) {
                  extraInfo.style.height = '0px';  // Collapse instantly
              } else {
                  extraInfo.style.height = extraInfo.scrollHeight + 'px';  // Expand instantly with smooth transition
              }
    });
    
    container.insertBefore(resultTile, loader);

  }



  let winner_tile = document.createElement("div");
  if (api.startsWith('sk-or')) {
    const total_usage = await chrome.runtime.sendMessage({ action: 'usage', apiKey: api })- initial_usage;
    winner_tile.innerText=`The winner for the prize category is ${winner} . Total Cost: $ ${total_usage}`;
  } else {
    winner_tile.innerText = `The winner for the prize category is ${winner} . Total Cost: $ ${total_cost}`;
  }

  winner_tile.className = "outer-box";
  container.insertBefore(winner_tile,loader)
  loader.style.display = "none";
  submitBtn.classList.remove('busy');
  console.log(winner);
  
});
  
chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {
  if (message.action == "tab_url") {
    console.log('received', message.url);
    Check(message.url);
  }
});
  
});
