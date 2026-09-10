const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const ts = require('typescript')
const assert = require('node:assert/strict')
const { getSchema } = require('@tiptap/core')
const { EditorState, TextSelection } = require('@tiptap/pm/state')
const { history, undo, redo } = require('@tiptap/pm/history')
const baseline = 'b481cc2f1d04a8e7109eccec6d73719c3f4344a4'
const tracked = new Set(cp.execFileSync('git',['ls-tree','-r','--name-only',baseline,'src'],{encoding:'utf8'}).trim().split(/\r?\n/))
function loader(original) {
  const cache = new Map()
  let id = 0
  function load(file) {
    file = file.replaceAll('\\','/')
    const candidates = [file, file+'.ts', file+'.tsx', file+'/index.ts',file+'/index.tsx']
    file = candidates.find(p=>original?tracked.has(p):fs.existsSync(p)&&fs.statSync(p).isFile())
    if(!file) throw Error('Missing module '+candidates[0])
    if(file.endsWith('.css')) return {}
    if(file.endsWith('/uuid.ts')) return {uuidV7:()=>`01900000-0000-7000-8000-${String(++id).padStart(12,'0')}`}
    if(cache.has(file)) return cache.get(file).exports
    const module={exports:{}}
    cache.set(file,module)
    let source=original?cp.execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}):fs.readFileSync(file,'utf8')
    // Expose private original functions only in the in-memory comparison harness.
    if(original && file.endsWith('/DragAndDrop.ts')) source+='\nexport { moveSelection, selectedBlockRange, blockRangeAtPosition }\nexport function setTestDrag(value) { activeDrag = value }'
    const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText
    const localRequire=specifier=>specifier.startsWith('.')?load(path.posix.normalize(path.posix.join(path.posix.dirname(file),specifier))):require(specifier)
    new Function('require','module','exports',code)(localRequire,module,module.exports)
    return module.exports
  }
  return {load,reset:()=>{id=0}}
}
const old=loader(true), current=loader(false), root='src/editors/tiptap/'
const originalExtensions=old.load(root+'extensions.ts')
const StarterKit=require('@tiptap/starter-kit').default
const oldExtensions=[StarterKit.configure({document:false,blockquote:false,heading:false,paragraph:false}),
  originalExtensions.BlockDocument,originalExtensions.BlockGroup,originalExtensions.BlockContainer,
  old.load(root+'blocks/paragraph/Paragraph.ts').Paragraph,old.load(root+'blocks/heading/Heading.ts').Heading,originalExtensions.Quote,
  ...['BulletListItem','NumberedListItem','CheckListItem'].map(n=>old.load(root+'blocks/list-types/'+n+'.ts')[n]),
  originalExtensions.BlockIds,originalExtensions.BlockBehavior,old.load(root+'drag-and-drop/DragAndDrop.ts').DragAndDrop,
  old.load(root+'menu/BlockMenu.ts').BlockMenu,originalExtensions.TextColor,originalExtensions.BackgroundColor]
const newExtensions=current.load(root+'editor-extensions.ts').createEditorExtensions()
assert.deepEqual(newExtensions.map(e=>[e.name,e.config.priority]),oldExtensions.map(e=>[e.name,e.config.priority]))
const schemas=[getSchema(oldExtensions),getSchema(newExtensions)]
const ser=[old.load(root+'serialization.ts'),current.load(root+'serialization/index.ts')]
let checks=0
function equal(a,b,label){assert.deepEqual(b,a,label);checks++}
const text=(s,styles={})=>({type:'text',text:s,styles})
const block=(type='paragraph',content=[text('abcd')],children=[])=>({id:'existing-'+type,type,props:{backgroundColor:'yellow',textColor:'blue',textAlignment:'center',level:3,start:7,checked:true},content,children})
const types=['paragraph','heading','quote','bulletListItem','numberedListItem','checkListItem']
for(const type of types) for(const empty of [false,true]) {
  const fixture=block(type,empty?[]:[text('a',{bold:true,italic:true,underline:true,strike:true,code:true,textColor:'red',backgroundColor:'pink'}),text('b'),text('c'),{type:'link',href:'https://example.com',content:[text('link',{bold:true}),text('next')]},text('')],[block('paragraph',[])])
  const results=ser.map((s,i)=>{[old,current][i].reset();const json=s.blockToTiptap(fixture);return [json,s.tiptapBlockToBlockNote(json)]})
  equal(...results,'serialization '+type+' '+empty)
}
for(const fixture of [
  {type:'blockContainer'},
  {type:'blockContainer',attrs:{id:'x'},content:[{type:'heading',attrs:{level:99}}]},
  {type:'blockContainer',content:[{type:'paragraph',content:[
    {type:'hardBreak'},
    {type:'text',text:'x',marks:[{type:'link',attrs:{href:'a'}}]},
    {type:'text',text:'y',marks:[{type:'link',attrs:{href:'a'}}]},
  ]}]},
]) {
  equal(...ser.map((s,i)=>{[old,current][i].reset();return s.tiptapBlockToBlockNote(fixture)}),'fallback')
}
function makeEditor(i,blocks,position,end=position,plugins=[]) {
 const doc=schemas[i].nodeFromJSON({type:'doc',content:blocks.map(ser[i].blockToTiptap)})
 let state=EditorState.create({doc,selection:TextSelection.create(doc,position,end),plugins})
 const transactions=[]
 const view={get state(){return state},editable:true,focus(){},dispatch(tr){transactions.push({steps:tr.steps.map(s=>s.toJSON()),selection:tr.selection.toJSON()});state=state.applyTransaction(tr).state}}
 return {get state(){return state},view,transactions}
}
function outcome(fn,editor){try{return {handled:fn(),doc:editor.state.doc.toJSON(),selection:editor.state.selection.toJSON(),transactions:editor.transactions}}catch(e){return {error:e.message}}}
for(const type of ['paragraph','heading','quote']) for(const empty of [false,true]) for(const nested of [false,true]) for(const offset of (empty?[0]:[0,2,4])) for(const selected of [false,true]) {
 const child=block(type,empty?[]:[text('abcd',{bold:true})],[block('paragraph',[text('child')])])
 const blocks=nested?[block('paragraph',[text('parent')],[child,block('paragraph',[text('sibling')])])]:[child]
 const pos=(nested?12:2)+offset
 const results=[old,current].map((l,i)=>{l.reset();const editor=makeEditor(i,blocks,pos,selected&&!empty&&offset<4?pos+1:pos,[history()]);
   let fn
   if(i===0){const extension=type==='quote'?originalExtensions.BlockBehavior:old.load(root+`blocks/${type}/${type==='paragraph'?'Paragraph':'Heading'}.ts`)[type==='paragraph'?'Paragraph':'Heading'];fn=extension.config.addKeyboardShortcuts.call({editor,type:schemas[i].nodes[type],options:extension.options}).Enter}
   else fn=()=>current.load(root+`blocks/${type}/${type}-enter.ts`)[`handle${type[0].toUpperCase()+type.slice(1)}Enter`](editor,schemas[i].nodes[type])
   const result=outcome(fn,editor)
   if(!result.error){undo(editor.state,editor.view.dispatch);result.undo=editor.state.doc.toJSON();redo(editor.state,editor.view.dispatch);result.redo=editor.state.doc.toJSON()}
   return result})
 equal(...results,`enter ${type} ${empty} ${nested} ${offset} ${selected}`)
}
for(const first of [true,false]) for(const empty of [true,false]) {
 const blocks=first?[block('paragraph',empty?[]:[text('x')])]:[block('paragraph',[text('previous')]),block('paragraph',empty?[]:[text('x')])]
 equal(...[old,current].map((l,i)=>{l.reset();const editor=makeEditor(i,blocks,first?2:14);const fn=i===0?originalExtensions.BlockBehavior.config.addKeyboardShortcuts.call({editor}).Backspace:()=>current.load(root+'extensions/delete-empty-block.ts').deleteEmptyBlockAndSelectPrevious(editor);return outcome(fn,editor)}),'delete empty')
}
const oldMenu=old.load(root+'menu/BlockMenu.ts'), newMenu=current.load(root+'menu/BlockMenu.ts')
for(const type of ['paragraph','heading-3','quote','bulletListItem','numberedListItem','checkListItem']) {
 equal(...[old,current].map((l,i)=>{l.reset();const extension=i?newMenu.BlockMenu:oldMenu.BlockMenu;const plugin=extension.config.addProseMirrorPlugins.call({})[0];const editor=makeEditor(i,[block('paragraph',[])],2,2,[plugin,history()]);const key=i?current.load(root+'menu/menu-state.ts').blockMenuKey:oldMenu.blockMenuKey;
   plugin.props.handleTextInput(editor.view,2,2,'/');editor.view.dispatch(editor.state.tr.insertText('he'));const query=key.getState(editor.state);const cmd=i?current.load(root+'menu/menu-commands.ts').executeBlockMenuItem:oldMenu.executeBlockMenuItem;const result=outcome(()=>cmd(editor.view,{type}),editor);return {query,result}}),'menu '+type)
}
for(const key of ['ArrowDown','ArrowUp','PageDown','PageUp','Escape','Enter']) {
 equal(...[old,current].map((l,i)=>{l.reset();const plugin=(i?newMenu.BlockMenu:oldMenu.BlockMenu).config.addProseMirrorPlugins.call({})[0];const editor=makeEditor(i,[block('paragraph',[])],2,2,[plugin]);plugin.props.handleTextInput(editor.view,2,2,'/');const handled=plugin.props.handleKeyDown(editor.view,{key,isComposing:false,preventDefault(){},stopPropagation(){}});const menuKey=i?current.load(root+'menu/menu-state.ts').blockMenuKey:oldMenu.blockMenuKey;return {handled,menu:menuKey.getState(editor.state),doc:editor.state.doc.toJSON()}}),'menu key '+key)
}
for(const direction of [-1,1]) for(const index of [0,1,2]) {
 equal(...[old,current].map((l,i)=>{l.reset();const editor=makeEditor(i,[block('paragraph',[text('aaaa')]),{...block('heading',[text('bbbb')]),id:'second'}, {...block('quote',[text('cccc')]),id:'third'}],2+index*8);const fn=i?current.load(root+'drag-and-drop/move-selection.ts').moveSelection:old.load(root+'drag-and-drop/DragAndDrop.ts').moveSelection;return outcome(()=>fn(editor.view,direction),editor)}),'move '+direction+' '+index)
}
for(const saved of [null,'{bad',JSON.stringify(types.map(t=>block(t)))]) {
 equal(...[old,current].map((l)=>{l.reset();let stored=saved;global.localStorage={getItem:()=>stored,setItem:(_k,v)=>{stored=v}};const storage=l.load(root+'storage.ts');const loaded=storage.loadTiptapContent();storage.saveTiptapContent(loaded);return {loaded,stored,reloaded:storage.loadTiptapContent()}}),'storage')
}
equal(...[old,current].map(l=>{l.reset();global.localStorage={getItem(){throw Error('unavailable')},setItem(){throw Error('full')}};const storage=l.load(root+'storage.ts');const loaded=storage.loadTiptapContent();storage.saveTiptapContent(loaded);return loaded}),'storage unavailable')
delete global.localStorage
for(const range of [[2,2],[2,12],[10,18]]) {
  equal(...[old,current].map((l,i)=>{l.reset();const editor=makeEditor(i,[block(),{...block(),id:'second'},{...block(),id:'third'}],...range);const functions=l.load(root+'drag-and-drop/'+(i?'block-range.ts':'DragAndDrop.ts'));const dragged=functions.blockRangeAtPosition(editor.state.doc,10);const selected=functions.selectedBlockRange(editor.view,dragged);return {from:selected.from,to:selected.to,node:selected.node.toJSON()}}),'selected block range')
}
for(const crossEditor of [false,true]) for(const target of [0,4,16]) {
  equal(...[old,current].map((l,i)=>{
    l.reset()
    const extension=l.load(root+'drag-and-drop/DragAndDrop.ts')
    const plugin=extension.DragAndDrop.config.addProseMirrorPlugins.call({})[0]
    const source=makeEditor(i,[block(),{...block(),id:'second'}],2,2,[plugin])
    const destination=crossEditor?makeEditor(i,[{...block(),id:'target'},{...block(),id:'target2'}],2,2,[plugin]):source
    destination.view.posAtCoords=()=>({pos:target})
    let removed=0
    let drag={from:0,to:8,node:source.state.doc.firstChild,source:source.view,slice:source.state.doc.slice(0,8),preview:{remove(){removed++}}}
    let restore=()=>{}
    if(!i) extension.setTestDrag(drag)
    else {
      const session=l.load(root+'drag-and-drop/drag-session.ts')
      const get=session.getActiveDrag,end=session.endDrag
      session.getActiveDrag=()=>drag
      session.endDrag=()=>{drag?.preview.remove();drag=null}
      restore=()=>{session.getActiveDrag=get;session.endDrag=end}
    }
    const handled=plugin.props.handleDOMEvents.drop(destination.view,{clientX:0,clientY:0,preventDefault(){}})
    restore()
    return {handled,source:source.state.doc.toJSON(),destination:destination.state.doc.toJSON(),selection:destination.state.selection.toJSON(),removed}
  }),'drop '+crossEditor+' '+target)
}
for(const duplicate of [false,true]) {
  equal(...[old,current].map((l,i)=>{
    l.reset()
    const ext=i?l.load(root+'extensions/BlockIds.ts').BlockIds:originalExtensions.BlockIds
    const plugin=ext.config.addProseMirrorPlugins.call({})[0]
    const blocks=[block(),{...block(),id:duplicate?'existing-paragraph':''}]
    const editor=makeEditor(i,blocks,2,2,[plugin])
    editor.view.dispatch(editor.state.tr.insertText('x'))
    return editor.state.doc.toJSON()
  }),'id repair '+duplicate)
}
function cssRules(source,context='') {
  const rules=[]
  let pos=0
  while(pos<source.length) {
    const open=source.indexOf('{',pos);if(open<0)break
    const selector=source.slice(pos,open).trim().replace(/\s+/g,' ')
    let depth=1,end=open+1
    for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;else if(source[end]==='}')depth--}
    const body=source.slice(open+1,end-1)
    if(selector.startsWith('@'))rules.push(...cssRules(body,selector))
    else rules.push([context,selector,body.trim().replace(/\s+/g,' ')])
    pos=end
  }
  return rules
}
const oldCss=cp.execFileSync('git',['show',baseline+':src/App.css'],{encoding:'utf8'})
const newCss=['src/App.css','src/editors/blocknote-editor.css',root+'editor.css',root+'blocks/list-types/list-types.css',root+'drag-and-drop/drag-and-drop.css'].flatMap(p=>cssRules(fs.readFileSync(p,'utf8')))
equal(cssRules(oldCss).map(JSON.stringify).sort(),newCss.map(JSON.stringify).sort(),'CSS rules and media queries')
// Validate the relative-import graph, including newly extracted modules.
const files=[]
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(p))files.push(p.replaceAll('\\','/'))}}
walk('src')
const graph=new Map()
for(const file of files){const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);const edges=[];for(const node of source.statements){if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier){const spec=node.moduleSpecifier.text;if(spec.startsWith('.')&&!spec.endsWith('.css')){const stem=path.posix.normalize(path.posix.join(path.posix.dirname(file),spec));const resolved=[stem,stem+'.ts',stem+'.tsx',stem+'/index.ts',stem+'/index.tsx'].find(p=>files.includes(p));assert.ok(resolved,'unresolved '+file+' '+spec);edges.push(resolved)}}}graph.set(file,edges)}
function visit(file,stack,done){assert.ok(!stack.includes(file),'cycle '+[...stack,file].join(' -> '));if(done.has(file))return;for(const dep of graph.get(file))visit(dep,[...stack,file],done);done.add(file)}
const done=new Set();for(const file of files)visit(file,[],done)
const large=files.filter(p=>fs.readFileSync(p,'utf8').trimEnd().split(/\r?\n/).length>150)
assert.deepEqual(large,[])
console.log(JSON.stringify({comparisons:checks,typescriptFiles:files.length,cycles:0,filesAbove150:large},null,2))
