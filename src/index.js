
class CloudUiView extends HTMLElement {
    constructor() {
        super();
        this.fields = new Map();
    }

    get backend() {
        return this.getAttribute("backend")
    }

    set backend(value) {
        let prefix = this.backend.substring(0,this.backend.lastIndexOf("/") +1);
        this.setAttribute("backend",prefix + value);
    }

    get token() {
        return this.getAttribute("bearer_token")
    }

    connectedCallback() {
        this.fetchApp();
    }

    fetchApp() {
        const url = this.backend;
        const auth_header = ((typeof(this.token) !== 'undefined') && (this.token !== null)) ? 'Bearer ' + this.token : '';
        return new Promise((res, rej) => {
            fetch(url ,{method: 'GET', headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': auth_header
            }
            },)
                .then(data => data.json())
                .then((json) => {
                    this.renderElement(json.view, this.shadowRoot);
                    this.handleEvents(json);
                })
                .catch((error) => rej(error));
        })
    }

    renderElement(component, parent) {
        const item = document.createElement(component.tag);
        item.id = component.id;
        if (component.hasInput) {
            item.value = component.value;
            item.addEventListener("input", (event) => {
            this.fields.set(item.id, item.value);
        });
        }
        if (component.innerHtml) {
            item.innerHTML = component.innerHtml;
        }
        if (component.attributes) {
            component.attributes.forEach((attribute) => {
                item.setAttribute(attribute.name,attribute.value);
            })
        }
        if (component.events) {
            component.events.forEach((eventdef) => {
                item.addEventListener(eventdef.eventName, (event) => {
                   let detail

                   if (event instanceof CustomEvent && event.detail) {
                       detail = event.detail;
                       if (eventdef.attributeMappings) {
                         eventdef.attributeMappings.forEach((mapping) => {
                            if (mapping.htmlElement) {
                                detail[mapping.fieldName] = detail[mapping.fieldName].id;
                            }
                         });
                       }
                   } else {
                       detail = event;
                   }
                    let message = { id: component.id, event: eventdef.eventName, fields: [], details: detail };
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

        this.fields.set(component.id, component.value);
        if (component.children) {
            component.children.forEach(child => this.renderElement(child, item));
        }

        parent.appendChild(item);
         if (component.properties) {
                    component.properties.forEach((property) => {
                        value = JSON.parse(property.value);
                        item[property.name] = value;
                    })
                }
        this.backend = component.id;
    }

    handleEvents(json) {
       if (json.title) {
         this.dispatchEvent( new CustomEvent("cloudui", {
                                 bubbles: true,
                                 detail: { type : 'setTitle',
                                 title: json.title
                                 },
         }));
       }
       if (json.changeUrl) {
         this.dispatchEvent( new CustomEvent("cloudui", {
                                 bubbles: true,
                                 detail: { type : 'replaceState',
                                 url: json.url }
         }));
       }
       if (json.alert) {
         this.dispatchEvent( new CustomEvent("cloudui", {
                                 bubbles: true,
                                 detail: { type : 'showAlert',
                                 text: json.text },
         }));
       }
    }

    sendToApp(message) {
        const url = this.backend;
        const auth_header = ((typeof(this.token) !== 'undefined') && (this.token !== null)) ? 'Bearer ' + this.token : '';
        return new Promise((res, rej) => {
            fetch(url,
                {
                    method: 'POST', headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                 //       'Authorization': auth_header
                    },
                    body: JSON.stringify(message)
                })
                .then(data => data.json())
                .then((json) => {
                    let oldNodes = []
                    this.shadowRoot.childNodes.forEach(item => {
                        oldNodes.push(item);
                    });
                    oldNodes.forEach(item => { this.shadowRoot.removeChild(item);})
                     if (json.navigation) {
                         this.dispatchEvent( new CustomEvent("cloudui", {
                            bubbles: true,
                            detail: { type : 'open',
                            url: json.url,
                            target: json.target },
                         }));
                     }
                     this.renderElement(json.view, this.shadowRoot);
                     this.handleEvents(json);
                })
                .catch((error) => rej(error));
        })
    }
}

customElements.define('cloudui-view', CloudUiView);