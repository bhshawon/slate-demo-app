import React from 'react';

const richMarks = {
  bold: {
    isTriggered: e => e.ctrlKey && e.key === 'b',
    render: (attributes, children) => <strong {...attributes}>{children}</strong>,
    icon: <i className="material-icons">format_bold</i>
  },
  italic: {
    isTriggered: e => e.ctrlKey && e.key === 'i',
    render: (attributes, children) => <em {...attributes}>{children}</em>,
    icon: <i className="material-icons">format_italic</i>
  },
  underline: {
    isTriggered: e => e.ctrlKey && e.key === 'u',
    render: (attributes, children) => <u {...attributes}>{children}</u>,
    icon: <i className="material-icons">format_underline</i>
  },
  code: {
    isTriggered: e => e.ctrlKey && e.key === '`',
    render: (attributes, children) => <code {...attributes}>{children}</code>,
    icon: <i className="material-icons">code</i>
  }
}

export default richMarks;
