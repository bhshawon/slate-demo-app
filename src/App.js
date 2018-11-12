import React, { Component } from 'react';
import { Editor } from 'slate-react'
import { Value } from 'slate'
import richNodes from './richNodes';
import richMarks from './richMarks';
import { lookup } from 'mime-types'

const DEFAULT_NODE_TYPE = 'paragraph';
const LIST_ITEM_NODE_TYPE = 'li';
const DOC_STORAGE_KEY = 'slate-doc';

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: DEFAULT_NODE_TYPE,
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: 'Start writing!',
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
    this.onValueChange = this.onValueChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onMarkClick = this.onMarkClick.bind(this);
    this.isMarkActive = this.isMarkActive.bind(this);
    this.openFileBrowser = this.openFileBrowser.bind(this);
    this.handleImage = this.handleImage.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleMaxTopNodes = this.handleMaxTopNodes.bind(this);
  }

  renderOptions = {}

  state = {
    value: initialValue,
    maxTopNodes: '',
    saveActive: true
  }

  ref = editor => {
    this.editor = editor;
  }

  // On change, update the app's React state with the new editor value.
  onValueChange = ({ value }) => {
    const currentNodeCount = value.document.nodes.size;
    const saveActive = !this.state.maxTopNodes || currentNodeCount <= this.state.maxTopNodes;
    this.setState({ value, saveActive })
  }

  onKeyDown = (event, editor, next) => {
    const { value } = this.state;
    let markToggled;
    if (event.keyCode === 9 && value.blocks.some(node => node.type === LIST_ITEM_NODE_TYPE)) {
      this.handleTabbedList(event, editor);
    }
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

  handleTabbedList = (event, editor) => {
    const { value } = this.state;
    event.preventDefault();
    const parent = value.document.getParent(value.blocks.first().key);
    const grandParent = parent && value.document.getParent(parent.key);

    // If Shift+Tab is pressed, go down indentation level
    if (event.shiftKey) {
      editor.unwrapBlock(parent.type);
      if (!this.isListNode(grandParent)) {
        editor.setBlocks(DEFAULT_NODE_TYPE);
      }
    } else {
      const grandGrandParent = grandParent && value.document.getParent(grandParent.key);
      // If current indentation level is less than 3, create nested list
      if (this.isListNode(parent) && !(this.isListNode(grandParent) && this.isListNode(grandGrandParent))) {
        editor.wrapBlock(parent.type)
      }
    }
  }

  isListNode = node => {
    return node && richNodes[node.type] && richNodes[node.type].list;
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
        this.editor.setBlocks({ type: DEFAULT_NODE_TYPE });
      } else {
        this.editor.setBlocks({ type: nodeType });
      }
    }
  }

  handleListBlock = nodeType => {
    const editor = this.editor;
    const blocks = this.state.value.blocks;
    const isList = blocks && blocks.some(node => node.type === LIST_ITEM_NODE_TYPE);
    const isType = blocks && blocks.some(block => {
      return !!editor.value.document.getClosest(block.key, parent => parent.type === nodeType)
    });
    const listNodes = Object
      .entries(richNodes)
      .filter(([_, richNode]) => richNode.list)

    if (isList && isType) {
      editor
        .setBlocks({ type: DEFAULT_NODE_TYPE })

      listNodes.forEach(([type]) => editor.unwrapBlock(type))
    } else if (isList) {
      listNodes
        .filter(([type]) => type !== nodeType)
        .forEach(([type]) => editor.unwrapBlock(type))

      editor.wrapBlock(nodeType)
    } else {
      editor.setBlocks(LIST_ITEM_NODE_TYPE).wrapBlock(nodeType)
    }
  }

  renderNode = (props, editor, next) => {
    const { children, node, attributes } = props

    const richNode = richNodes[node.type];

    if (richNode) {
      return richNode.render(attributes, children, node);
    } else {
      return next();
    }
  }

  openFileBrowser = () => {
    this.fileInput.click();
  }

  handleImage = event => {
    if (this.isImage(event)) {
      const file = event.target.files[0];
      const reader = new FileReader()
      reader.onload = () => {
        this.editor.insertBlock({ type: 'image', data: { source: reader.result } });
        this.editor.insertBlock(DEFAULT_NODE_TYPE);
      }
      reader.readAsDataURL(file);
    }
  }

  isImage = event => {
    return event.target.files && lookup(event.target.files[0].name).split('/')[0] === 'image';
  }

  handleSave = () => {
    localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(this.state.value.toJSON()));
  }

  handleCancel = () => {
    const storedDoc = localStorage.getItem(DOC_STORAGE_KEY);
    if (storedDoc) {
      const value = Value.fromJSON(JSON.parse(storedDoc));
      this.setState({ value })
    } else {
      this.setState({ value: Value.fromJSON(initialValue) })
    }
  }

  handleMaxTopNodes = event => {
    this.setState({ maxTopNodes: event.target.value });
  }

  render() {
    return (
      <div style={{ margin: '50px' }}>
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
          <button onClick={this.openFileBrowser} className='btn-inactive'><i className="material-icons">image</i></button>

          <span style={{ width: '20px', display: 'inline-block' }}></span>

          <button onClick={this.handleSave} className={this.state.saveActive ? 'btn-active' : 'btn-inactive'}>
            <i className="material-icons">save</i>
          </button>
          <button onClick={this.handleCancel} className='btn-active'><i className="material-icons">cancel</i></button>

          <input type='number' onChange={this.handleMaxTopNodes} placeholder="Max top nodes" />

          <input
            type="file"
            className="hidden"
            onChange={this.handleImage}
            ref={input => this.fileInput = input}
          />
        </div>
        <Editor
          autoFocus
          value={this.state.value}
          onChange={this.onValueChange}
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
