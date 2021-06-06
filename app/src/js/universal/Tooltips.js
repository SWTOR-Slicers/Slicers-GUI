export function addTooltip(orientation, element, multiCheck, callback, eventType=null) {
    //callback function will return the value we want to display in the tooltip
    //callbacks must always take the element as a parameter
    
    const parent = element.parentNode;
    element.remove()

    const tooltipContainer = document.createElement('div');
    tooltipContainer.className = "tooltip";


    if (multiCheck) {
        element.addEventListener(eventType, function() {
            this.nextSiblingElement.innerText = callback(element);
        });
    }
    tooltipContainer.appendChild(element);

    const tooltipText = document.createElement('span');
    tooltipText.className = `tooltip-text tooltip-${orientation}`;
    tooltipText.innerText = callback(element);
    tooltipContainer.appendChild(tooltipText);

    parent.replaceChild(tooltipContainer, element)
}