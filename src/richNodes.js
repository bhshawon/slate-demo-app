import React from 'react';

const richNodes = {
  h1: {
    render: (attributes, children) => <h1 {...attributes}>{children}</h1>,
    icon: <i className="material-icons">looks_one</i>
  },
  h2: {
    render: (attributes, children) => <h2 {...attributes}>{children}</h2>,
    icon: <i className="material-icons">looks_two</i>
  },
  quote: {
    render: (attributes, children) => <blockquote {...attributes}>{children}</blockquote>,
    icon: <i className="material-icons">format_quote</i>
  },
  ol: {
    list: true,
    render: (attributes, children) => <ol {...attributes}>{children}</ol>,
    icon: <i className="material-icons">format_list_numbered</i>
  },
  ul: {
    list: true,
    render: (attributes, children) => <ul {...attributes}>{children}</ul>,
    icon: <i className="material-icons">format_list_bulleted</i>
  },
  li: {
    render: (attributes, children) => <li {...attributes}>{children}</li>
  },
  image: {
    render: (attributes, children, node) => {
      return <div><img alt="" src={node.data.get('source')} {...attributes}></img>{children}</div>;
    }
  }
}

export default richNodes;
