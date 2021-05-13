import React, {useEffect, FC, useRef, useState} from 'react';
import 'antd/dist/antd.css';
import {Button, Drawer, Input, InputNumber, Select, Spin, Tree, version} from 'antd';
import {CarryOutOutlined, FormOutlined, MenuOutlined} from '@ant-design/icons';
import {Layout, Breadcrumb} from 'antd';
import {io} from 'socket.io-client';
import MonacoEditor, {MonacoEditorProps} from 'react-monaco-editor';

import {useAppDispatch, useAppSelector} from './store/store';
import {counterSlice} from './store/counter';
import {viewSlice} from './store/view';

const {Header, Content, Footer} = Layout;
const {Option} = Select;

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    icon: <CarryOutOutlined />,
    children: [
      {
        title: 'parent 1-0',
        key: '0-0-0',
        icon: <CarryOutOutlined />,
        children: [
          {title: 'leaf', key: '0-0-0-0', icon: <CarryOutOutlined />},
          {
            title: (
              <>
                <div>multiple line title</div>
                <div>multiple line title</div>
              </>
            ),
            key: '0-0-0-1',
            icon: <CarryOutOutlined />,
          },
          {title: 'leaf', key: '0-0-0-2', icon: <CarryOutOutlined />},
        ],
      },
      {
        title: 'parent 1-1',
        key: '0-0-1',
        icon: <CarryOutOutlined />,
        children: [{title: 'leaf', key: '0-0-1-0', icon: <CarryOutOutlined />}],
      },
      {
        title: 'parent 1-2',
        key: '0-0-2',
        icon: <CarryOutOutlined />,
        children: [
          {title: 'leaf', key: '0-0-2-0', icon: <CarryOutOutlined />},
          {
            title: 'leaf',
            key: '0-0-2-1',
            icon: <CarryOutOutlined />,
            switcherIcon: <FormOutlined />,
          },
        ],
      },
    ],
  },
  {
    title: 'parent 2',
    key: '0-1',
    icon: <CarryOutOutlined />,
    children: [
      {
        title: 'parent 2-0',
        key: '0-1-0',
        icon: <CarryOutOutlined />,
        children: [
          {title: 'leaf', key: '0-1-0-0', icon: <CarryOutOutlined />},
          {title: 'leaf', key: '0-1-0-1', icon: <CarryOutOutlined />},
        ],
      },
    ],
  },
];

const selectBefore = (
  <Select defaultValue="GET">
    <Option value="GET">GET</Option>
    <Option value="POST">POST</Option>
    <Option value="PUT">PUT</Option>
    <Option value="DELETE">DELETE</Option>
  </Select>
);
const selectAfter = (
  <Select defaultValue="json">
    <Option value="js">js</Option>
    <Option value="json">json</Option>
    <Option value="json5">json5</Option>
  </Select>
);

const widthDimensions = <P extends object>(WrapperComponent: React.ComponentType<P>): React.FC<P> => {
  return (props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const componentRef = useRef<any>(null);
    const [dimension, setDimension] = useState<{width: string; height: string}>({width: '100%', height: '100%'});

    useEffect(() => {
      const observer = new ResizeObserver((...args) => {
        if (componentRef.current) componentRef.current.containerElement.style.display = 'none';
        const newDimension = {
          height: `${containerRef.current?.clientHeight}px`,
          width: `${containerRef.current?.clientWidth}px`,
        }
        if (componentRef.current) componentRef.current.containerElement.style.display = '';
        setDimension(newDimension);
      });
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      // containerRef.current;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      return () => {
        containerRef.current && observer.unobserve(containerRef.current);
      }
    }, []);
    return (
      <>
        {/* <div style={{position: 'absolute', zIndex: 1, background: 'aliceblue'}}>{JSON.stringify(dimension)}</div> */}
        <div style={{width: '100%', height: '100%'}} ref={containerRef}>
          <WrapperComponent ref={componentRef} {...props} {...dimension}></WrapperComponent>
        </div>
      </>
    );
  };
};

const MonacoEditorDim = widthDimensions<MonacoEditorProps>(MonacoEditor);

function App() {
  // const selector = useAppSelector(({counter}) => counter);
  const view = useAppSelector(({view}) => view);
  const dispatch = useAppDispatch();
  const [text, setText] = useState('');


  useEffect(() => {
    const URL = 'localhost:3001';
    const socket = io(URL, {
      path: '/_editor/socket',
      transports: ['websocket'],
    });
    socket.onAny((event, ...args) => {
      console.log(event, args);
    });
  }, []);

  const options = {
    selectOnLineNumbers: true,
  };

  return (
    <>
      <Layout className="layout">
        <Header className="header">
          <MenuOutlined className="trigger" onClick={() => dispatch(viewSlice.actions.toggleDrawer())} />
          <div className="input-path-container">
            <Input className="input-path" addonBefore={selectBefore} addonAfter={selectAfter} defaultValue="mysite" />
          </div>
        </Header>
        <Content style={{padding: '50px 50px 0 50px', flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
          <div className="app">
            {/* <h1>antd version: {version}</h1>
            <InputNumber value={selector.value}></InputNumber>
            <Button
              type="primary"
              style={{marginLeft: 8}}
              onClick={() => dispatch(counterSlice.actions.incrementByAmount(10))}>
              Primary Button
            </Button> */}
            <Spin spinning={true}>
              <MonacoEditorDim language="typescript" theme="vs-dark" value={text} onChange={setText} options={options} />
            </Spin>
          </div>
        </Content>
        <Footer style={{textAlign: 'center'}}>Ant Design ©2018 Created by Ant UED</Footer>
      </Layout>
      <Drawer
        title="Basic Drawer"
        placement={'left'}
        closable={true}
        onClose={() => dispatch(viewSlice.actions.closeDrawer())}
        visible={view.showDrawer}>
        <Tree treeData={treeData} />

        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Drawer>
    </>
  );
}

export default App;
