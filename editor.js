// JavaScript for AI Editor functionality
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const isEditMode = params.get('edit') === '1';

    if (isEditMode) {
        document.body.classList.add('edit-mode-active');
        initializeEditor();
    } else {
        // Optionally, hide editor elements explicitly if not using CSS only
        const editorElements = ['dominique-interface', 'saveButton'];
        editorElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
});

function initializeEditor() {
    const canvas = document.querySelector('.canvas');
    const dominiqueInterface = document.getElementById('dominique-interface');
    const commandInput = document.getElementById('dominique-command-input');
    let selectedElement = null;

    // Function to activate and focus Dominique's interface
    function activateDominiqueInterface() {
        if (dominiqueInterface && commandInput) {
            dominiqueInterface.style.display = 'block'; // Or 'flex'
            commandInput.focus();
        } else {
            console.error("Dominique interface or command input not found for activation in edit mode.");
        }
    }

    if (canvas) {
        canvas.addEventListener('click', (event) => {
            const clickedElement = event.target;

            if (clickedElement === canvas) {
                if (selectedElement) {
                    selectedElement.classList.remove('selected-highlight');
                    if (selectedElement.contentEditable === 'true') {
                        selectedElement.contentEditable = 'false';
                    }
                    selectedElement = null;
                }
                if (dominiqueInterface) dominiqueInterface.style.display = 'none';
                return;
            }
            
            if (clickedElement === selectedElement) {
                return;
            }

            if (selectedElement) {
                selectedElement.classList.remove('selected-highlight');
                if (selectedElement.contentEditable === 'true') {
                    selectedElement.contentEditable = 'false';
                }
            }

            selectedElement = clickedElement;
            if (canvas.contains(selectedElement) && selectedElement !== canvas) {
                 selectedElement.classList.add('selected-highlight');
                 if (isEditable(selectedElement)) {
                    selectedElement.contentEditable = 'true';
                 }
                 activateDominiqueInterface();
                 console.log('Selected element:', selectedElement, 'Editable:', selectedElement.contentEditable);
            } else {
                if (selectedElement) {
                    selectedElement.classList.remove('selected-highlight');
                    if (selectedElement.contentEditable === 'true') {
                        selectedElement.contentEditable = 'false';
                    }
                }
                selectedElement = null;
                if (dominiqueInterface) dominiqueInterface.style.display = 'none';
            }
        });
    } else {
        console.error('Canvas element not found in edit mode!');
    }

    const dominiqueSubmitButton = document.getElementById('dominique-submit-button');
    const dominiqueInfoButton = document.getElementById('dominique-info-button');
    const dominiqueCommandHelp = document.getElementById('dominique-command-help');

    if (dominiqueSubmitButton && commandInput) {
        dominiqueSubmitButton.addEventListener('click', (event) => {
            event.preventDefault();
            const commandText = commandInput.value.trim();
            if (selectedElement && commandText) {
                executeCommand(selectedElement, commandText);
                commandInput.value = '';
            } else if (!selectedElement) {
                console.warn("No element selected. Please click on an element in the canvas first.");
            } else if (!commandText) {
                console.warn("Command input is empty. Please type a command.");
            }
        });
    } else {
        if (!dominiqueSubmitButton) console.error('Dominique submit button not found in edit mode!');
        if (!commandInput) console.error('Dominique command input not found in edit mode!');
    }

    if (dominiqueInfoButton && dominiqueCommandHelp) {
        // Populate help content
        dominiqueCommandHelp.innerHTML = `
            <h4>Available Commands:</h4>
            <ul>
                <li><code>make text bigger</code></li>
                <li><code>make text smaller</code></li>
                <li><code>center text</code></li>
                <li><code>change text to: [your new text]</code></li>
                <li><code>create list: item1, item2, ...</code></li>
                <li><code>create card: Title | Description | Button Text</code></li>
                <li><code>create two columns</code></li>
            </ul>
        `;

        // Add event listener to toggle help display
        dominiqueInfoButton.addEventListener('click', () => {
            const isHelpVisible = dominiqueCommandHelp.style.display === 'block';
            dominiqueCommandHelp.style.display = isHelpVisible ? 'none' : 'block';
        });
    } else {
        if (!dominiqueInfoButton) console.error('Dominique info button not found in edit mode!');
        if (!dominiqueCommandHelp) console.error('Dominique command help div not found in edit mode!');
    }


    function executeCommand(element, commandString) {
        console.log(`Executing command on element <${element.tagName.toLowerCase()}>: "${commandString}" in edit mode`);

        if (commandString.toLowerCase() === "make text bigger") {
            const currentSize = window.getComputedStyle(element).fontSize;
            if (currentSize) {
                element.style.fontSize = (parseFloat(currentSize) + 2) + 'px';
            } else {
                element.style.fontSize = '18px'; // Default if no current size
            }
        } else if (commandString.toLowerCase() === "make text smaller") {
            const currentSize = window.getComputedStyle(element).fontSize;
            if (currentSize && parseFloat(currentSize) > 2) { // Prevent making text too small or negative
                element.style.fontSize = (parseFloat(currentSize) - 2) + 'px';
            } else if (currentSize && parseFloat(currentSize) <=2 ) {
                console.warn("Text is already too small to reduce further.");
            }
            else {
                 element.style.fontSize = '14px'; // Default if no current size
            }
        } else if (commandString.toLowerCase() === "center text") {
            element.style.textAlign = 'center';
        } else if (commandString.toLowerCase().startsWith("change text to: ")) {
            const newText = commandString.substring("change text to: ".length).trim();
            if (newText) {
                element.innerText = newText;
            } else {
                console.warn("No text provided for 'change text to' command.");
            }
        } else if (commandString.toLowerCase().startsWith("create list: ")) {
            const itemsString = commandString.substring("create list: ".length).trim();
            const items = itemsString.split(',').map(item => item.trim()).filter(item => item);

            if (items.length > 0) {
                element.innerHTML = ''; // Clear existing content
                const ul = document.createElement('ul');
                items.forEach(itemText => {
                    const li = document.createElement('li');
                    li.textContent = itemText;
                    ul.appendChild(li);
                });
                element.appendChild(ul);
            } else {
                console.warn("No items provided for 'create list' command. Format: create list: item1, item2");
            }
        } else if (commandString.toLowerCase() === "create two columns") {
            createTwoColumns(element);
        } else if (commandString.toLowerCase().startsWith("create card: ")) {
            const paramsString = commandString.substring("create card: ".length).trim();
            const params = paramsString.split('|').map(p => p.trim());
            if (params.length === 3) {
                createCard(element, params[0], params[1], params[2]);
            } else {
                console.warn("Invalid format for 'create card'. Expected: create card: Title | Description | Button Text");
            }
        } else {
            console.error("Unknown command: " + commandString);
        }
    }

    function createTwoColumns(element) {
        const children = Array.from(element.childNodes); // Collect all child nodes
        element.innerHTML = ''; // Clear the element

        const columnContainer = document.createElement('div');
        columnContainer.style.display = 'flex'; // Use flexbox for columns
        columnContainer.style.width = '100%'; // Container takes full width

        const column1 = document.createElement('div');
        column1.classList.add('column');
        column1.style.flexBasis = '50%'; // Each column takes half
        column1.style.boxSizing = 'border-box';
        column1.style.padding = '10px';
        // column1.style.border = '1px dashed #ccc'; // Basic styling, can be moved to CSS

        const column2 = document.createElement('div');
        column2.classList.add('column');
        column2.style.flexBasis = '50%';
        column2.style.boxSizing = 'border-box';
        column2.style.padding = '10px';
        // column2.style.border = '1px dashed #ccc'; // Basic styling, can be moved to CSS

        if (children.length === 0) {
            column1.textContent = "Column 1";
            column2.textContent = "Column 2";
        } else {
            const midpoint = Math.ceil(children.length / 2);
            children.forEach((child, index) => {
                if (index < midpoint) {
                    column1.appendChild(child.cloneNode(true)); // Append a clone to preserve original if needed elsewhere
                } else {
                    column2.appendChild(child.cloneNode(true));
                }
            });
        }
        
        element.appendChild(columnContainer); // Append the container that holds the columns
        columnContainer.appendChild(column1);
        columnContainer.appendChild(column2);
        console.log(`Created two columns in element <${element.tagName.toLowerCase()}>`);
    }

    function createCard(element, title, description, buttonText) {
        element.innerHTML = ''; // Clear the element

        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');

        const titleElem = document.createElement('h3');
        titleElem.classList.add('card-title');
        titleElem.textContent = title;

        const descElem = document.createElement('p');
        descElem.classList.add('card-description');
        descElem.textContent = description;

        const buttonElem = document.createElement('button');
        buttonElem.classList.add('card-button');
        buttonElem.textContent = buttonText;

        cardDiv.appendChild(titleElem);
        cardDiv.appendChild(descElem);
        cardDiv.appendChild(buttonElem);

        element.appendChild(cardDiv);
        console.log(`Created card in element <${element.tagName.toLowerCase()}> with title: "${title}"`);
    }

    // Save Page functionality
    const saveButton = document.getElementById('saveButton');
    if (saveButton && canvas) { // Ensure canvas is also available
        saveButton.addEventListener('click', () => {
            // Deselect any element to remove highlights and contentEditable before saving
            if (selectedElement) {
                selectedElement.classList.remove('selected-highlight');
                if (selectedElement.contentEditable === 'true') {
                    selectedElement.contentEditable = 'false';
                }
                dominiqueInterface.style.display = 'none';
                selectedElement = null;
            }

            const canvasContent = canvas.innerHTML;
            const pageTitle = "My Saved Page"; // Or prompt user for a title

            const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <!-- Optional: Include a way to link to a generic stylesheet or inline critical styles -->
</head>
<body>
    ${canvasContent}
</body>
</html>`;

            const blob = new Blob([fullHtml], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'saved_page.html';
            document.body.appendChild(link); // Required for Firefox
            link.click();
            document.body.removeChild(link); // Clean up
            URL.revokeObjectURL(link.href); // Clean up

            console.log("Page saved.");
        });
    } else {
        if (!saveButton) console.error('Save button not found in edit mode!');
        if (!canvas) console.error('Canvas element not found for saving in edit mode!');
    }

    // isEditable needs to be accessible by the canvas click listener within initializeEditor
    window.isEditable = function(element) { // Make it global or pass it around
        if (!element) return false;
        const tagName = element.tagName.toLowerCase();
        const nonEditableClasses = ['card', 'column', 'row']; 
        const editableTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span', 'button'];

        if (editableTags.includes(tagName)) {
            return true;
        }

        if (tagName === 'div') {
            for (const className of nonEditableClasses) {
                if (element.classList.contains(className)) {
                    return false;
                }
            }
            const blockChildren = element.querySelectorAll('div, p, ul, h1, h2, h3, h4, h5, h6');
            if (blockChildren.length > 0) {
                if (element.parentElement === canvas && blockChildren.length > 0) { // canvas needs to be in scope or passed
                    return true;
                }
                if (element.classList.contains('card-description')) return true;
                return false; 
            }
            return true;
        }
        return false;
    }
} // End of initializeEditor
