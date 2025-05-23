// JavaScript for AI Editor functionality
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('.canvas');
    const dominiqueInterface = document.getElementById('dominique-interface');
    const commandInput = document.getElementById('dominique-command-input'); // Get commandInput here for activateDominiqueInterface
    let selectedElement = null;

    // Function to activate and focus Dominique's interface
    function activateDominiqueInterface() {
        if (dominiqueInterface && commandInput) {
            dominiqueInterface.style.display = 'block'; // Or 'flex'
            commandInput.focus();
        } else {
            console.error("Dominique interface or command input not found for activation.");
        }
    }

    if (canvas) {
        canvas.addEventListener('click', (event) => {
            const clickedElement = event.target;

            // Prevent selection if clicking the canvas itself
            if (clickedElement === canvas) {
                // If canvas background is clicked, deselect and hide interface
                if (selectedElement) {
                    selectedElement.classList.remove('selected-highlight');
                    selectedElement = null;
                }
                dominiqueInterface.style.display = 'none';
                return;
            }
            
            // If the clicked element is already selected, do nothing
            if (clickedElement === selectedElement) {
                return;
            }

            // If a different element is clicked (and it's not the canvas)
            // Deselect previous element
            if (selectedElement) {
                selectedElement.classList.remove('selected-highlight');
                if (selectedElement.contentEditable === 'true') {
                    selectedElement.contentEditable = 'false';
                }
            }

            selectedElement = clickedElement;
            // Ensure the clicked element is a direct child of the canvas or deeper, but not the canvas itself
            if (canvas.contains(selectedElement) && selectedElement !== canvas) {
                 selectedElement.classList.add('selected-highlight');
                 if (isEditable(selectedElement)) {
                    selectedElement.contentEditable = 'true';
                 }
                 activateDominiqueInterface(); // Call the new function
                 console.log('Selected element:', selectedElement, 'Editable:', selectedElement.contentEditable);
            } else {
                // Clicked outside of a selectable element or on the canvas itself, effectively deselect
                if (selectedElement) { // This might be redundant if selectedElement was properly nulled above
                    selectedElement.classList.remove('selected-highlight');
                    if (selectedElement.contentEditable === 'true') {
                        selectedElement.contentEditable = 'false';
                    }
                }
                selectedElement = null;
                dominiqueInterface.style.display = 'none';
            }
        });
    } else {
        console.error('Canvas element not found!');
    }

    // Dominique command submission
    const dominiqueSubmitButton = document.getElementById('dominique-submit-button');
    // commandInput is already defined at the top of DOMContentLoaded

    if (dominiqueSubmitButton && commandInput) {
        dominiqueSubmitButton.addEventListener('click', (event) => {
            event.preventDefault(); // Good practice, though button is not in a form here

            const commandText = commandInput.value.trim();

            if (selectedElement && commandText) {
                executeCommand(selectedElement, commandText); // Call the new function
                commandInput.value = ''; // Clear the input field
                // Dominique interface remains open for further commands
            } else if (!selectedElement) {
                console.warn("No element selected. Please click on an element in the canvas first.");
            } else if (!commandText) {
                console.warn("Command input is empty. Please type a command.");
            }
        });
    } else {
        console.error('Dominique interface elements (submit button or command input) not found!');
    }

    function executeCommand(element, commandString) {
        console.log(`Executing command on element <${element.tagName.toLowerCase()}>: "${commandString}"`);

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
        if (!saveButton) console.error('Save button not found!');
        if (!canvas) console.error('Canvas element not found for saving!');
    }

    function isEditable(element) {
        if (!element) return false;
        const tagName = element.tagName.toLowerCase();
        const nonEditableClasses = ['card', 'column', 'row']; // Classes that indicate structural elements
        const editableTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span', 'button'];

        if (editableTags.includes(tagName)) {
            return true;
        }

        if (tagName === 'div') {
            // Check if it's a simple div, not a structural one
            for (const className of nonEditableClasses) {
                if (element.classList.contains(className)) {
                    return false; // It's a structural div, don't make the whole thing editable
                }
            }
            // Check if it contains other block elements. If so, maybe not directly editable.
            // This is a simple check; could be more sophisticated.
            const blockChildren = element.querySelectorAll('div, p, ul, h1, h2, h3, h4, h5, h6');
            if (blockChildren.length > 0) {
                // If it's a div that's a direct child of .canvas and contains other blocks,
                // it's likely a user-created container. Let's allow it.
                // Otherwise, if it's deeper and has blocks, it might be part of a component.
                if (element.parentElement === canvas && blockChildren.length > 0) {
                    return true;
                }
                // More refined: if it's a div like card-description, it should be editable
                if (element.classList.contains('card-description')) return true;

                return false; 
            }
            return true; // Simple div with no block children or non-editable classes
        }
        return false;
    }
});
