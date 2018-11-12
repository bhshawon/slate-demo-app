import React, { Component } from 'react';
import { Editor } from 'slate-react'
import { Value } from 'slate'
import richNodes from './richNodes';
import richMarks from './richMarks';

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: 'A line of text in a paragraph.',
              },
            ],
          },
        ],
      },
    ],
  },
})

class App extends Component {
  constructor() {
    super();
    this.onMarkClick = this.onMarkClick.bind(this);
    this.isMarkActive = this.isMarkActive.bind(this);
  }

  state = {
    value: initialValue,
  }

  ref = editor => {
    this.editor = editor;
  }

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }) => {
    this.setState({ value })
  }

  onKeyDown = (event, editor, next) => {
    let markToggled;
    Object
      .entries(richMarks)
      .forEach(([key, richMark]) => {
        if (richMark.isTriggered(event)) {
          markToggled = true;
          event.preventDefault();
          this.editor.toggleMark(key);
        }
      })
    if (!markToggled) {
      return next();
    }
  }

  onMarkClick = markType => {
    this.editor.toggleMark(markType);
  }

  isMarkActive = markType => richMarks[markType] &&
    this.state.value.activeMarks.some(mark => mark.type === markType);

  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props

    const richMark = richMarks[mark.type];

    if (richMark) {
      return richMark.render(attributes, children);
    }
  }

  isBlockActive = nodeType => this.state.value.anchorBlock && this.state.value.anchorBlock.type === nodeType

  onBlockClick = nodeType => {
    if (richNodes[nodeType] && richNodes[nodeType].list) {
      this.handleListBlock(nodeType);
    } else {
      if (this.isBlockActive(nodeType)) {
        this.editor.setBlocks({ type: 'paragraph' });
      } else {
        this.editor.setBlocks({ type: nodeType });
      }
    }
  }

  handleListBlock = nodeType => {
    const editor = this.editor;
    const blocks = this.state.value.blocks;
    const isList = blocks && blocks.some(node => node.type === 'li');
    const isType = blocks && blocks.some(block => {
      return !!editor.value.document.getClosest(block.key, parent => parent.type === nodeType)
    });
    const listNodes = Object
      .entries(richNodes)
      .filter(([_, richNode]) => richNode.list)

    if (isList && isType) {
      editor
        .setBlocks({ type: 'paragraph' })

      listNodes.forEach(([type]) => editor.unwrapBlock(type))
    } else if (isList) {
      listNodes
        .filter(([type]) => type !== nodeType)
        .forEach(([type]) => editor.unwrapBlock(type))

      editor.wrapBlock(nodeType)
    } else {
      editor.setBlocks('li').wrapBlock(nodeType)
    }
  }

  renderNode = (props, editor, next) => {
    const { children, node, attributes } = props

    const richNode = richNodes[node.type];

    if (richNode) {
      return richNode.render(attributes, children, editor);
    } else {
      return next();
    }
  }

  render() {
    return (
      <div>
        <div>
          {
            Object.entries(richMarks).map(([key, richMark]) =>
              <button
                key={key}
                onClick={() => this.onMarkClick(key)}
                className={this.isMarkActive(key) ? 'btn-active' : 'btn-inactive'}
              >
                {richMark.icon}
              </button>
            )
          }
          {
            Object.entries(richNodes)
              .filter(([key, richNode]) => richNode.icon)
              .map(([key, richNode]) =>
                <button
                  key={key}
                  onClick={() => this.onBlockClick(key)}
                  className={this.isBlockActive(key) ? 'btn-active' : 'btn-inactive'}
                >
                  {richNode.icon}
                </button>
              )
          }
        </div>
        <Editor
          autoFocus
          value={this.state.value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          renderMark={this.renderMark}
          renderNode={this.renderNode}
          ref={this.ref}
        />
      </div>
    );
  }
}

export default App;
