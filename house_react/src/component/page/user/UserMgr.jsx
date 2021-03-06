// @Author : guanghe
import React from "react";
import {Form,Input,Button,Col,message,Collapse,DatePicker,Select,Table,Modal} from 'antd';
import moment from "moment";
import Global from "../../Global";
import GHFetch from "../../../utils/FetchUtil";
import EditModal from "./EditModal";
const Option = Select.Option;
const confirm = Modal.confirm;
const dateFormat = "YYYY-MM-DD";

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			requestParams:{},
			pageNum:1,
			pageSize:10,
			dataSource:[],
			total:0,
			selectedRowKeys:[],
			levelData:{},
			levelOption:[],
			genderOption:[],
			statusOption:[],
			modal:[],
		};
	}
	componentDidMount() {
  		this.getDataDictionary("level");	
  		this.getDataDictionary("status");
  		this.getDataDictionary("gender");
  		this.doRequest();
  	}
	doRequest = () => {
		var that = this;
		var requestParams = this.state.requestParams;
		requestParams.pageNum = this.state.pageNum ? this.state.pageNum : 1;
		requestParams.pageSize = this.state.pageSize ? this.state.pageSize : 10;
		var callback = (json) => {
			let dataSource = json.data;
			for(let i = 0; i < dataSource.length; i++) {
				dataSource[i].key = i;
				dataSource[i].indexNum = i + 1;
				dataSource[i].levelValue = that.state.levelData[dataSource[i].level];
				dataSource[i].createTime = moment(dataSource[i].createTime).format(dateFormat);
			}
	    	that.setState({dataSource:dataSource,total:json.total,selectedRowKeys:[]});
		}
		GHFetch(Global.Url.user_getList, requestParams, callback);
	}
	handleSearch = () => {
		var requestParams = this.props.form.getFieldsValue();
		if(requestParams.createTime) {
			requestParams.createTime = moment(requestParams.createTime).format(dateFormat);
		}
		this.setState({requestParams:requestParams},() => {
			this.doRequest();
		});
	}
	getDataDictionary = (option) => {
		var that = this;
		var url = null;
		var callback = null;
		switch (option) {
			case "level" :
				url = Global.Url.public_getDictionary + "user_level";
				callback = (json) => {
					var levelData = {};
					var levelOption = [];
					if(json.status !== 200) {
						message.error(json.msg);
					} else {
						levelData = json.data;
						for(let level in levelData) {
							levelOption.push(<Option key={level}>{levelData[level]}</Option>);
						}
						that.setState({levelOption:levelOption,levelData:levelData});
					}
				}
				GHFetch(url, null, callback);
				break;
			case "status" :
				url = Global.Url.public_getDictionary + "public_status";
				callback = (json) => {
					if(json.status !== 200) {
						message.error(json.msg);
					} else {
						let statusData = json.data;
						let statusOption = [];
						for(let status in statusData) {
							statusOption.push(<Option key={status}>{statusData[status]}</Option>);
						}
						that.setState({statusOption:statusOption});
					}
				}
				GHFetch(url, null, callback);
				break;
			case "gender" :
				url = Global.Url.public_getDictionary + "user_gender";
				callback = (json) => {
					var genderOption = [];
					if(json.status !== 200) {
						message.error(json.msg);
					} else {
						let genderData = json.data;
						for(let gender in genderData) {
							genderOption.push(<Option key={gender}>{genderData[gender]}</Option>);
						}
						that.setState({genderOption:genderOption});
					}
				}
				GHFetch(url, null, callback);
				break;
			default : alert("Bad get Dictionary");
		}
	}
	persistFun = (option) => {
		var that = this;
		switch (option) {
			case "showCreate" :
				this.setState({modal:[<EditModal funName={"showCreate"} 
					doRequest={this.doRequest} state={this.state} key={0}
					closeModal={()=>{that.setState({modal:[]})}}/>]}); 
				break;
			case "showUpdate" :
				this.setState({modal:[<EditModal funName={"showUpdate"} 
					doRequest={this.doRequest} state={this.state} key={0}
					closeModal={()=>{this.setState({modal:[]});}} />]}); 
				break;
			case "detail" :
				this.setState({modal:[<EditModal funName={"detail"} 
					state={this.state} key={0}
					closeModal={()=>{this.setState({modal:[]});}} />]}); 
				break;
			case "delete" :
				confirm({
					title:"确认",
					content:"您确认要删除吗？",
					onCancel() {return;},
					onOk() {
						let params = {id:that.state.dataSource[that.state.selectedRowKeys[0]].id};
						let callback = (json) => {
							if(json.status !== 200) {
								message.error(json.msg);
							} else {
								message.success("删除成功！");
								that.doRequest();
							}
						}
						GHFetch(Global.Url.user_delete,params,callback);
					}
				});
				break;
			case "exportExcel" :
				var requestParams = this.state.requestParams;
				requestParams.pageNum = this.state.pageNum ? this.state.pageNum : 1;
				requestParams.pageSize = this.state.pageSize ? this.state.pageSize : 10;
				let paramsStr = "";
				if(requestParams != null) {
					let first = true;
					for(let p in requestParams) {
						if(requestParams[p]) {
							paramsStr += (first ? "?" : "&") + p + "=" + requestParams[p];
							first = false;
						}
					}
				}
				window.open(Global.Url.user_exportExcel + paramsStr);
				break;
			default : alert("Bad persistFun");
		}
	}
	render() {
		const search = "";
		const hasSelected = this.state.selectedRowKeys.length > 0;
		const {getFieldDecorator} = this.props.form;
		const FormItem = Form.Item;
		const Panel = Collapse.Panel;
		const rowSelection = {selectedRowKeys:this.state.selectedRowKeys,type:"radio",
			onChange : (selectedRowKeys) => {
				if(selectedRowKeys[0] === this.state.selectedRowKeys[0]) {
					this.setState({selectedRowKeys:[]});
				}else {
					this.setState({selectedRowKeys:selectedRowKeys});
				}
			}};
		const pagination = {
			total:this.state.total,showSizeChanger:true,current:this.state.pageNum,
			onShowSizeChange : (current,pageSize) => {
				this.setState({pageNum:1,pageSize:pageSize},() => {this.doRequest()});
			},
			onChange : (current) => {
				this.setState({pageNum:current},() => {this.doRequest()});
			}
		};	
		const columns = [
			{title:"序号",dataIndex:"indexNum",key:"indexNum"},
			{title:"用户名",dataIndex:"username",key:"username"},
			{title:"年龄",dataIndex:"age",key:"age"},
			{title:"地址",dataIndex:"address",key:"address"},
			{title:"用户类型",dataIndex:"levelValue",key:"levelValue"},
			{title:"创建时间",dataIndex:"createTime",key:"createTime"}
		];
		return (
			<div>
				<div style={{marginBottom:10}}>
					<Collapse bordered={false} defaultActiveKey={["0","1"]}>
						<Panel header={"查询"} key={"0"}>
							<Form>
								<Col span={6}>
									<FormItem label={"用户名"} labelCol={{span:10}} wrapperCol={{span:14}}>
										{getFieldDecorator(`username${search}`,
											{initialValue:"",rules:[{required:false,message:"请输入姓名！"}]})(
											<Input placeholder="请输入" />)}
									</FormItem>
								</Col>
								<Col span={6}>
									<FormItem label={"用户类型"} labelCol={{span:10}} wrapperCol={{span:14}}>
										{getFieldDecorator(`level${search}`,
											{initialValue:"",rules:[{required:false,message:"请输入区域！"}]})(
											<Select placeholder="请选择" >
												{this.state.levelOption}
											</Select>)}
									</FormItem>
								</Col>
								<Col span={6}>
									<FormItem label={"注册日期"} labelCol={{span:10}} wrapperCol={{span:14}}>
										{getFieldDecorator(`createTime${search}`,
											{initialValue:null,rules:[{required:false,message:"请选择日期！"}]})(
											<DatePicker format={dateFormat}/>)}
									</FormItem>
								</Col>
								<Col span={6} style={{paddingLeft:"40px"}}>
									<Button title={"查询"} type="primary" icon="search" style={{marginRight:10}} onClick={this.handleSearch}>查询</Button>
									<Button title={"清空"} type="primary" icon="close-circle" style={{marginRight:10}} onClick={() => {
										this.props.form.resetFields([`username${search}`,`level${search}`,`createTime${search}`])}}>清空</Button>
								</Col>
							</Form>
						</Panel>
						<Panel header={"用户管理"} key={"1"}>
							<Button title={"增加"} type="ghost" icon="check" style={{marginRight:10,height:28}} onClick={this.persistFun.bind(this,"showCreate")}>增加</Button>
							<Button title={"修改"} type="ghost" icon="edit" style={{marginRight:10,height:28}} onClick={this.persistFun.bind(this,"showUpdate")} disabled={!hasSelected}>修改</Button>
							<Button title={"删除"} type="ghost" icon="close" style={{marginRight:10,height:28}} onClick={this.persistFun.bind(this,"delete")} disabled={!hasSelected}>删除</Button>
							<Button title={"详细信息"} type="ghost" icon="exclamation-circle-o" style={{marginRight:10,height:28}} onClick={this.persistFun.bind(this,"detail")} disabled={!hasSelected}>详细信息</Button>
							<Button title={"导出Excel"} type="ghost" icon="arrow-down" style={{marginRight:10,height:28}} onClick={this.persistFun.bind(this,"exportExcel")} >导出Excel</Button>
						</Panel>
					</Collapse>
				</div>
				<Table size="middle" pagination={pagination} columns={columns} 
					rowSelection={rowSelection} dataSource={this.state.dataSource}
					bordered footer={() => "总记录数 " + this.state.total + " 条"}/>
				{this.state.modal}
			</div>
		);
	}
}
export default Form.create()(App);
