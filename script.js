const dropdowns = document.querySelectorAll(".dropdown-container"),
  inputLanguageDropdown = document.querySelector("#input-language"),
  outputLanguageDropdown = document.querySelector("#output-language"),
  inputTextElem = document.querySelector("#input-text"),
  outputTextElem = document.querySelector("#output-text"),
  closeIcon = document.querySelector("#close-icon"),
  inputChars = document.querySelector("#input-chars");

// Function to populate dropdowns with language options
function populateDropdown(dropdown, options) {
  dropdown.querySelector("ul").innerHTML = "";
  options.forEach((option) => {
    const li = document.createElement("li");
    li.innerHTML = option.name; // Only display the language name
    li.dataset.value = option.code;
    li.classList.add("option");
    dropdown.querySelector("ul").appendChild(li);
  });
}

// Populate both dropdowns with language options
populateDropdown(inputLanguageDropdown, languages);
populateDropdown(outputLanguageDropdown, languages);

// Add event listeners to dropdowns for toggling and selection
dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("click", () => {
    dropdown.classList.toggle("active");
  });

  dropdown.querySelectorAll(".option").forEach((item) => {
    item.addEventListener("click", () => {
      dropdown.querySelectorAll(".option").forEach((item) => {
        item.classList.remove("active");
      });
      item.classList.add("active");
      const selected = dropdown.querySelector(".selected");
      selected.innerHTML = item.innerHTML;
      selected.dataset.value = item.dataset.value;
      translate();
    });
  });
});

// Close dropdown if clicked outside
document.addEventListener("click", (e) => {
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
});

// Swap languages and text when swap button is clicked
const swapBtn = document.querySelector(".swap-position");
swapBtn.addEventListener("click", () => {
  const tempLang = inputLanguageDropdown.querySelector(".selected").innerHTML;
  inputLanguageDropdown.querySelector(".selected").innerHTML = outputLanguageDropdown.querySelector(".selected").innerHTML;
  outputLanguageDropdown.querySelector(".selected").innerHTML = tempLang;

  const tempValue = inputLanguageDropdown.querySelector(".selected").dataset.value;
  inputLanguageDropdown.querySelector(".selected").dataset.value = outputLanguageDropdown.querySelector(".selected").dataset.value;
  outputLanguageDropdown.querySelector(".selected").dataset.value = tempValue;

  const tempText = inputTextElem.value;
  inputTextElem.value = outputTextElem.value;
  outputTextElem.value = tempText;

  translate();
});

// Function to handle translation
function translate() {
  const inputText = inputTextElem.value;
  const inputLanguage = inputLanguageDropdown.querySelector(".selected").dataset.value;
  const outputLanguage = outputLanguageDropdown.querySelector(".selected").dataset.value;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${inputLanguage}&tl=${outputLanguage}&dt=t&q=${encodeURI(inputText)}`;

  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      outputTextElem.value = json[0].map((item) => item[0]).join("");
    })
    .catch((error) => {
      console.log(error);
    });
}

// Show the close icon if there is text in the textarea, and hide it otherwise
inputTextElem.addEventListener("input", () => {
  if (inputTextElem.value.length > 0) {
    closeIcon.style.display = "block";
  } else {
    closeIcon.style.display = "none";
  }

  // Limit input to 5000 characters
  if (inputTextElem.value.length > 5000) {
    inputTextElem.value = inputTextElem.value.slice(0, 5000);
  }

  inputChars.innerHTML = inputTextElem.value.length;
  translate();
});

// Clear the textarea when the close icon is clicked
closeIcon.addEventListener("click", () => {
  inputTextElem.value = "";
  closeIcon.style.display = "none";
  inputChars.innerHTML = "0";
  translate();
});

// Handle file upload and processing
const uploadDocument = document.querySelector("#upload-document");
uploadDocument.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type === "application/pdf") {
    readPDF(file);
  } else if (
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    readWord(file);
  } else if (file.type === "text/plain") {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
      inputTextElem.value = e.target.result;
      translate();
    };
  } else {
    alert("Please upload a valid file");
  }
});

// Functions to read PDF and Word files
function readPDF(file) {
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = (e) => {
    const loadingTask = pdfjsLib.getDocument({ data: e.target.result });
    loadingTask.promise.then((pdf) => {
      let text = "";
      let pagesPromises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pagesPromises.push(
          pdf.getPage(i).then((page) =>
            page.getTextContent().then((textContent) => {
              textContent.items.forEach((item) => {
                text += item.str + " ";
              });
            })
          )
        );
      }
      Promise.all(pagesPromises).then(() => {
        inputTextElem.value = text.trim();
        translate();
      });
    });
  };
}

function readWord(file) {
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = (e) => {
    const arrayBuffer = e.target.result;
    const zip = new PizZip(arrayBuffer);
    const doc = new docxtemplater().loadZip(zip);
    const text = doc.getFullText();
    inputTextElem.value = text.trim();
    translate();
  };
}

// Copy translated text to clipboard
function copyToClipboard() {
  var outputText = document.getElementById("output-text");
  if (navigator.clipboard) {
    navigator.clipboard.writeText(outputText.value)
      .then(() => {
        console.log("Copied to clipboard: " + outputText.value);
      })
      .catch((error) => {
        console.error("Unable to copy to clipboard", error);
      });
  } else {
    alert("Your browser doesn't support the Clipboard API. Please use a different method to copy the text.");
  }
  var copyPopup = document.getElementById("copyPopup");
  copyPopup.style.opacity = 1;

  setTimeout(function() {
    copyPopup.style.opacity = 0;
  }, 1500);
}

// Handle download of translated text
const downloadBtn = document.querySelector("#download-btn");
downloadBtn.addEventListener("click", () => {
  const outputText = outputTextElem.value;
  const outputLanguage = outputLanguageDropdown.querySelector(".selected").dataset.value;
  if (outputText) {
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `translated-to-${outputLanguage}.txt`;
    a.href = url;
    a.click();
  }
});
