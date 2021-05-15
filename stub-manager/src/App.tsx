import React, {useEffect, useState} from 'react';
import {Drawer, Input, Select, Spin, Tree, Layout, Tabs, TabsProps, Tooltip} from 'antd';
import {MenuOutlined} from '@ant-design/icons';

import MonacoEditor, {MonacoEditorProps} from 'react-monaco-editor';

import {useAppDispatch, useAppSelector} from './store/store';
// import {counterSlice} from './store/counter';
import {viewSlice} from './store/view';
// import {treeData} from './sample-data';
import {SocketService} from './services/socket.service';
import {withDimensions} from './hoc/withDimensions';

const {Header, Content, Footer} = Layout;
const {Option} = Select;
const {TabPane} = Tabs;
const {DirectoryTree} = Tree;

const socketService = SocketService.instance();

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

const MonacoEditorDim = withDimensions<MonacoEditorProps>(MonacoEditor);

function App() {
  // const selector = useAppSelector(({counter}) => counter);
  const {view, stub} = useAppSelector((state) => state);

  const dispatch = useAppDispatch();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await socketService.init(dispatch);
      socketService.requestFiles();
    })();
  }, []);

  const options = {
    selectOnLineNumbers: true,
    readOnly: loading,
  } as MonacoEditorProps['options'];

  const onEditTabs: TabsProps['onEdit'] = (targetKey, action) => {
    debugger;
    if (action === 'remove') {
      debugger;
      dispatch(viewSlice.actions.closeTab(targetKey as string));
      // setTabs(tabList.filter(item => item +'' !== targetKey))
    }
  };
  const setActiveTab = (activeTab: string) => {
    dispatch(viewSlice.actions.setActiveTab(activeTab));
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
        <Content style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
          <div className="app" onClick={() => setLoading(!loading)}>
            <Tabs
              size={'small'}
              activeKey={view.activeTab}
              onChange={setActiveTab}
              type={'editable-card'}
              hideAdd
              onEdit={onEditTabs}>
              {view.tabs.map(({name, tip, uid}) => (
                <TabPane
                  key={uid}
                  tab={
                    <Tooltip title={tip} placement="bottom">
                      <span>{name}</span>
                    </Tooltip>
                  }
                  closable={true}
                  animated={true}>
                   {uid === '0' ? (
                    <Spin spinning={loading}>
                      <MonacoEditorDim
                        language="typescript"
                        theme="vs-dark"
                        value={text}
                        onChange={setText}
                        options={options}
                      />
                    </Spin>
                  ) : (
                    <>Content of tab {uid}</>
                  )}
                </TabPane>
              ))}
            </Tabs>
            
          </div>
        </Content>
        <Footer style={{textAlign: 'center'}}>Ant Design ©2018 Created by Ant UED</Footer>
      </Layout>


      <Drawer
        title="Basic Drawer"
        placement={'left'}
        closable={true}
        bodyStyle={{padding: 0, display: 'flex', flexDirection: 'column'}}
        onClose={() => dispatch(viewSlice.actions.closeDrawer())}
        visible={view.showDrawer}>
        <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
          <Spin spinning={stub.pending}>
            <DirectoryTree treeData={stub.files} />
          </Spin>
        </div>
      </Drawer>
    </>
  );
}

export default App;
