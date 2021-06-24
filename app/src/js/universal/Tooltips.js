/**
 * @type {Event}
 */
export const updateTooltipEvent = new Event('updateTooltip');

/**
 * Adds a tooltip to the specified element
 * @param  {String} orientation Side of the element to display the tooltip on
 * @param  {Node} element Element to attach the tooltip to
 * @param  {Boolean} multiCheck Whether or not the tooltip value will dynamically update. Element will get passed to it, allowing values to be updated.
 * @param  {Function} callback Callback function that provides the tooltip value (rerun on eventType event trigger)
 * @param  {String} [eventType='updateTooltip'] Event to update tooltip on. updateTooltip event is used by default
 */
export function addTooltip(orientation, element, multiCheck, callback, eventType='updateTooltip') {
    const parent = element.parentNode;
    const tooltipContainer = document.createElement('div');
    tooltipContainer.className = "tooltip";
    const e = parent.replaceChild(tooltipContainer, element);

    if (multiCheck) {
        e.addEventListener(eventType, function() {
            this.nextElementSibling.innerText = callback(this);
        });
    }
    tooltipContainer.appendChild(e);

    const tooltipText = document.createElement('span');
    tooltipText.className = `tooltip-text tooltip-${orientation}`;
    tooltipText.innerText = callback(e);
    tooltipContainer.appendChild(tooltipText);
}

/**
 * Removes the tooltip from the specified element
 * @param  {Node} element Element to remove tooltip from
 * @param  {Boolean} multiCheck Whether or no tthe tooltip was multicheck
 * @param  {Function} callback Callback function used to get the tooltip value
 * @param  {String} [eventType='updateTooltip'] Event to update tooltip on. updateTooltip event is used by default
 */
export function removeTooltip(element, multiCheck, callback, eventType='updateTooltip') {
    
    const parent = element.parentNode;
    const e = parent.removeChild(element);

    if (multiCheck) {
        e.removeEventListener(eventType, function() {
            this.nextElementSibling.innerText = callback(this);
        });
    }
    parent.parentNode.replaceChild(e, parent);
}