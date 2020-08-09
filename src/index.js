
class OpenDxpPortlet extends HTMLElement {
    constructor() {
        super();
        this.fields = new Map();
    }

    get backend() {
        return this.getAttribute("backend")
    }

    set backend(value) {
        this.setAttribute("backend", value);
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.fetchApp();
    }

    disconnectedCallback() {
        console.log("OpenDxpPortlet disconnecetCallback called");
    }

    fetchApp() {
        return new Promise((res, rej) => {
            fetch(this.backend ,{method: 'GET', headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'}
            },)
                .then(data => data.json())
                .then((json) => {
                    json.forEach(component => {
                        console.log(component);
                        this.renderElement(component, this.shadowRoot);
                    });
                })
                .catch((error) => rej(error));
        })
    }

    renderElement(component, parent) {
        const item = document.createElement(component.tag);
        item.id = component.id;
        if (component.value) {
            item.value = component.value;
            item.addEventListener("input", (event) => {
                console.log(event);
                console.log(event.path[0].id);
                const field = event.path[0];
                this.fields.set(field.id, field.value);
            });
        }
        if (component.innerHtml) {
            item.innerHTML = component.innerHtml;
        }
        if (component.attributes) {
            console.log(component.attributes)
            component.attributes.forEach((attribute) => {
                item.setAttribute(attribute.name,attribute.value);
            })
        }
        if (component.events) {
            component.events.forEach((eventdef) => {
                item.addEventListener(eventdef, (event) => {
                   
                    let message = { id: component.id, event: eventdef, fields: [] };
                    this.fields.forEach((value, key) => {
                        if (value) {
                            let field = { name: key, value: value };
                            message.fields.push(field);
                        }
                    });
                    this.sendToApp(message);
                });
            });
        }

        parent.appendChild(item);

        this.fields.set(component.id, component.value);
        if (component.children) {
            component.children.forEach(child => this.renderElement(child, item));
        }
        this.backend = component.id;
    }

    sendToApp(message) {
        return new Promise((res, rej) => {
            fetch(this.backend, 
                {
                    method: 'POST', headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                })
                .then(data => data.json())
                .then((json) => {
                    console.log(this.shadowRoot);
                    this.shadowRoot.childNodes.forEach(item => {
                        this.shadowRoot.removeChild(item);
                    });
                    console.log(this.shadowRoot);
                    json.forEach(component => {
                        console.log(component);
                        this.renderElement(component, this.shadowRoot);
                    });
                })
                .catch((error) => rej(error));
        })
    }
}

customElements.define('open-dxp-portlet', OpenDxpPortlet);