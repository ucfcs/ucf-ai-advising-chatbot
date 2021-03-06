import React from 'react';
import {DEV_MODE} from '../../requestUtils'
import { ContentBox } from './ContentBox/ContentBox';
import {sections, adminOnly, retrain, check_needs_training, update_needs_training, logOut} from './home'
import {confirmAlert} from 'react-confirm-alert';
import './homebox.css';
import knugHeader from '../images/KnugBot_Logo_White.png';
import knugget from '../images/Knugget_flip.png'

export class HomeBox extends React.Component {

    constructor(props) {
        super(props);
        console.log(this.props.isAdmin);
        this.contentRef = React.createRef();

        this.hasChanges = this.hasChanges.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleSelected = this.handleSelected.bind(this);
        this.handleRetrain = this.handleRetrain.bind(this);
        this.handleUpdateTrain = this.handleUpdateTrain.bind(this);

        this.state = {
            selection: 'navbox-questions',
            selectedNode: '',
            needsTraining: 'Fully Trained'
        }
    }

    componentDidMount() {
        check_needs_training((response)=> {
            if (response.success) {
                this.setState({needsTraining:response.trained});
            }
        });
    }

    hasChanges() {
        return this.contentRef.current.hasChanges();
    }

    handleLogout(event) {
        event.preventDefault();
        if (this.hasChanges()) {
            confirmAlert({
                title:"You have unsaved changes",
                message: "Do you want to leave without saving your changes?",
                buttons: [
                    {
                        label: "Yes",
                        onClick: ()=> logOut()
                    },
                    {
                        label: "Cancel",
                        onClick: ()=>{}
                    }
                ]});
        } else {
            logOut();
        }
    }

    handleSelected(event) {
        event.preventDefault();
        this.contentRef.current.saveCurrent(()=>
            this.setState({selection:event.target.id, selected:event.target})); 
    }

    handleRetrain(event) {
        event.preventDefault();
        if (this.state.needsTraining === 'Needs Training') {
            confirmAlert({
                title: 'Do you want to retrain the system?',
                message: '',
                buttons: [
                    {
                        label: 'Yes, retrain',
                        onClick: ()=>{
                            update_needs_training('Training Now', (response)=> {
                                if (response.success) {
                                    this.setState({needsTraining:'Training Now'}, ()=>{
                                        retrain((res)=> {
                                            if (res.trained) {
                                                update_needs_training('Fully Trained', (finResponse)=> {
                                                    if (finResponse.success) {
                                                        this.setState({needsTraining:'Fully Trained'});
                                                    } else {
                                                        alert(finResponse.message);
                                                    }
                                                });
                                            } else {
                                                update_needs_training('Needs Training', (finResponse)=> {
                                                    if (finResponse.success) {
                                                        this.setState({needsTraining:'Needs Training'});
                                                    } else {
                                                        alert(finResponse.message);
                                                    }
                                                });
                                            }
                                            alert(res.message);
                                        });
                                    }); 
                                } else {
                                    alert(response.message);
                                }
                            });
                        }
                    },
                    {
                        label: 'No, don\'t retrain yet',
                        onClick: ()=>{}
                    }
                ]
            })      
        }
    }

    handleUpdateTrain(value) {
        this.setState({needsTraining:value});
    }

    render() {
        if (!DEV_MODE && window.sessionStorage.getItem('token') === null) {
            logOut();
        }
        return (
            <div id='home-box'>
                <div id='sidebox'>
                    <div id='navbar'>
                        <div id='nav-header'>
                            <img 
                            id='knug-header'
                            src={knugHeader} 
                            alt='Pegasus logo with the text: \"KnugBot CS/IT Advising Chatbot\"' 
                            />
                        </div>
                        <div id='navboxes'>
                            {sections.map(section=> {
                                if (!adminOnly.includes(section) || this.props.isAdmin)
                                    return <NavBox 
                                    sectionName={section} 
                                    selected={this.state.selection === ('navbox-'+(section.toLowerCase()))}
                                    clicked={this.handleSelected}
                                    />
                            })}
                        </div>
                    </div>
                    <img id='knugget' src={knugget} />
                    <div id='train-button-wrapper'>
                        <div 
                        id='train-button'
                        className={'button train-button ' + ({
                            'Needs Training': 'need-training',
                            'Training Now': 'training',
                            'Fully Trained': 'trained'
                        }[this.state.needsTraining])}
                        onClick={this.handleRetrain}
                        >
                        {this.state.needsTraining === 'Needs Training' ?
                         'Click to Train' : this.state.needsTraining === 'Training Now' ?
                        'Training...' : this.state.needsTraining}
                        </div>
                    </div>
                    <div id='log-out-wrapper'>
                        <div id='log-out' className='button log-out-button' onClick={this.handleLogout}>
                            Log Out
                        </div>
                    </div>
                </div>
                <ContentBox ref={this.contentRef} selection={this.state.selection} updateTrain={this.handleUpdateTrain}/>
            </div>
        );
    }
}

export default HomeBox;

function NavBox(props) {
    return (
        <div className={'navbox' + (props.selected === true ? ' selected' : '')}
         id={'navbox-'+(props.sectionName.toLowerCase())} onClick={(event)=>props.clicked(event)}>
            {props.sectionName}
        </div>
    );
}