chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
    console.log('Agent active !');
  });

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab && tab.url) {
      console.log('tab url', tab.url);
      handleTabChange(tab.url);
    }
  });
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {   
  if (changeInfo.url) {
    console.log('tab url', tab.url);
    handleTabChange(changeInfo.url);
  }
});


function handleTabChange(url) {
  try {  chrome.runtime.sendMessage({
    action: "tab_url",
    url: url
    
  });} catch {
    console.log('receiving end check');
  }
 
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetch') {
    const controller = request.signal ? new AbortController() : null;
    const signal = controller ? controller.signal : undefined;
    fetch(request.url,{signal})
      .then(response => response.text())
      .then(data => sendResponse({ data }))
      .catch(error => sendResponse({ error: error.message }));
    return true; 
  }

  if (request.action == 'usage') {
    fetch("https://openrouter.ai/api/v1/credits", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${request.apiKey}`
      }
    })
      .then(response => response.json())
      .then(data => {
        sendResponse(data.data.total_usage);
      }) 
  .catch(error => console.error("Error:", error));
    return true;
  }

  if (request.action === 'OpenRouter') {
    fetch(request.url, {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${request.apiKey}`,
          "Content-Type": "application/json"
      },
      body: JSON.stringify(request.payload) 
      //above stringify adds \n and stuff !
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
        }     
        console.log('Response status:', response.status); // Debug without reading the body
        return response.json();  //yaha tak all good, openai and openrouter
      })
      .then(data => {
        //debugging
        // console.log('response.json()====>',data);
        
        let contentText = data.choices[0].message.content;
        //console.log('contenttext', contentText);
        let jsonMatch = contentText.match(/```json\n([\s\S]+?)\n```/);
        if (jsonMatch) {
          let cleanedJsonString = jsonMatch[1]; 
          let extractedJson = JSON.parse(cleanedJsonString);
          sendResponse({ data: extractedJson });

        } else {
          console.log("Invalid JSON format");
          throw new Error('Invalid JSON response from server');}

    })
      .catch(error => {
        sendResponse({ error: `API sent an Invalid respnse . Damn it! Error: ${error.message}` });
      });
  
    return true;
  }

  if (request.action === 'OpenAI') {
    fetch(request.url, {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${request.apiKey}`,
          "Content-Type": "application/json"
      },
      body: JSON.stringify(request.payload) 
      })
      .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }     
        console.log('Response status:', response.status); // Debug without reading the body
        return response.json();  //assuming response is a valid json
      })
      .then(data => {
        //content may not be properly formatted !
        
        let contentText = data.choices[0].message.content;
        let extractedJson = JSON.parse(contentText); 
        sendResponse({ data:extractedJson, input : data.usage.prompt_tokens , output: data.usage.completion_tokens });
       
    })
      .catch(error => {
        sendResponse({ error: `API sent an Invalid respnse . Damn it! Error: ${error.message}` });
      });
  
    return true;
  }

});
