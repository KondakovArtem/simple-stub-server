import React from 'react';
import 'antd/dist/antd.css';
import {Button, Drawer, InputNumber, Tree, version} from 'antd';
import {CarryOutOutlined, FormOutlined, MenuOutlined} from '@ant-design/icons';
import {Layout, Breadcrumb} from 'antd';

import {useAppDispatch, useAppSelector} from './store/store';
import {counterSlice} from './store/counter';
import {viewSlice} from './store/view';

const {Header, Content, Footer} = Layout;

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

function App() {
  const selector = useAppSelector(({counter}) => counter);
  const view = useAppSelector(({view}) => view);
  const dispatch = useAppDispatch();

  return (
    <>
      <Layout className="layout">
        <Header className="header">
          <MenuOutlined className="trigger" onClick={() => dispatch(viewSlice.actions.toggleDrawer())} />
        </Header>
        <Content style={{padding: '0 50px', flexGrow: 1}}>
          <Breadcrumb style={{margin: '16px 0'}}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>List</Breadcrumb.Item>
            <Breadcrumb.Item>App</Breadcrumb.Item>
          </Breadcrumb>
          <div className="site-layout-content">Content</div>
          <div className="App">
            <h1>antd version: {version}</h1>
            <InputNumber value={selector.value}></InputNumber>
            <Button
              type="primary"
              style={{marginLeft: 8}}
              onClick={() => dispatch(counterSlice.actions.incrementByAmount(10))}>
              Primary Button
            </Button>
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
