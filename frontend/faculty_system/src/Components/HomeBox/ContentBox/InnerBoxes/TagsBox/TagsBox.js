import { cloneDeep, isEqual } from 'lodash';
import React from 'react';
import Select from 'react-select';
import {confirmAlert} from 'react-confirm-alert';
import SelectionBox from '../SelectionBox';
import { 
    defaultTag, 
    getTags, 
    tagTypes, 
    hasAllFields, 
    addTag, 
    updateTag,
    checkTypeDependents,
    checkDependents,
    deleteTag
} from './tags';
import './tagsbox.css';

export class TagsBox extends React.Component {

    constructor(props) {
        super(props);

        this.saveCurrent = this.saveCurrent.bind(this);
        this.concatTags = this.concatTags.bind(this);
        this.selectItem = this.selectItem.bind(this);
        this.updateDisplayedTags = this.updateDisplayedTags.bind(this);
        this.selectType = this.selectType.bind(this);
        this.filterSearch = this.filterSearch.bind(this);
        this.handleSelectType = this.handleSelectType.bind(this);
        this.hasValidChanges = this.hasValidChanges.bind(this);
        this.hasChanges = this.hasChanges.bind(this);
        this.canSave = this.canSave.bind(this);
        this.handleAddTag = this.handleAddTag.bind(this);
        this.handleUpdateTag = this.handleUpdateTag.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleDelete = this.handleDelete.bind(this);

        this.state = {
            search:'',
            tags:{
                'intent': [],
                'category': [],
                'department': [],
                'information': []

            },
            displayedTags:[],
            curTag: cloneDeep(defaultTag),
            curType: 'all',

            savingTag:false,
            deletingTag:false
        }
    }

    componentDidMount() {
        getTags((tags)=> {
            this.setState({tags:tags}, ()=>{
                let tagFromStorage = window.sessionStorage.getItem('previous_tag');
                let typeFromStorage = window.sessionStorage.getItem('previous_type');
                if (tagFromStorage !== null) {
                    this.setState({curTag:JSON.parse(tagFromStorage)});
                }
                if (typeFromStorage !== null) {
                    this.setState({curType:JSON.parse(typeFromStorage)});
                }
                this.setState({displayedTags:this.concatTags()}, ()=>this.updateDisplayedTags());
            });
        });
    }

    saveCurrent(callback) {
        window.sessionStorage.setItem('previous_tag', JSON.stringify(this.state.curTag));
        window.sessionStorage.setItem('previous_type', JSON.stringify(this.state.curType));
        callback();
    }

    concatTags() {
        let tagList = [];
        for (const [key, value] of Object.entries(this.state.tags)) {
            tagList = tagList.concat(value.map(tag=>{
                return {
                    _id:tag._id,
                    name:tag.name,
                    type:key
                };
            }));
        }
        return tagList;
    }

    selectItem(event, item) {
        event.preventDefault();
        if (this.state.curTag._id !== item._id || this.state.curTag._id === '') {
            if (this.hasChanges()) {
                confirmAlert({
                    title:"You have unsaved changes",
                    message: "Do you want to leave without saving your changes?",
                    buttons: [
                        {
                            label: "Yes",
                            onClick: ()=>{
                                let tag = cloneDeep(item);
                                if (isEqual(tag, defaultTag)) {
                                    tag.type = this.state.curType === 'all' ? '' : this.state.curType;
                                }
                                this.setState({curTag:tag});
                            }
                        },
                        {
                            label: "No",
                            onClick: ()=>{}
                        }
                    ]});
            } else {
                let tag = cloneDeep(item);
                if (isEqual(tag, defaultTag)) {
                    tag.type = this.state.curType === 'all' ? '' : this.state.curType;
                }
                this.setState({curTag:tag});
            }
        }
    }

    updateDisplayedTags() {
        let tags = this.concatTags();

        let dis = tags.filter(t=>{
            return (this.state.curType === 'all' || t.type === this.state.curType) && 
            t.name.toLowerCase().includes(this.state.search.toLowerCase());
        });

        dis.sort((a, b)=> (a.name > b.name) ? 1 : -1)
        this.setState({displayedTags:dis});
    }

    selectType(event, item) {
        event.preventDefault();
        if (this.state.curType !== item.name) {
            this.setState({curType:item.name}, ()=>{
                this.updateDisplayedTags();
            });
        }
    }

    filterSearch(event) {
        this.setState({search:event.target.value}, ()=> {
            this.updateDisplayedTags();
        });
    }

    handleSelectType(event) {
        let tag = this.state.curTag;
        tag.type = event.value;
        this.setState({curTag:cloneDeep(tag)});
    }

    hasValidChanges() {
        let tags = this.state.tags[this.state.curTag.type];
        if (tags === undefined) {
            return true;
        } else {
            let check = tags.filter(t=>{
                return t.name === this.state.curTag.name;
            })[0]
            if (check !== undefined) {
                return check._id === this.state.curTag._id;
            } else {
                return true;
            }
        }
    }

    hasChanges() {
        if (this.state.curTag._id === '') {
            return this.state.curTag.name !== '';
        } else {
            let tags = this.concatTags();
            let cur = tags.filter(t=>{
                return t._id === this.state.curTag._id;
            })[0];
            return !isEqual(this.state.curTag, cur);
        }
    }

    canSave() {
        return this.hasChanges() && this.hasValidChanges() && hasAllFields(this.state.curTag).hasFields;
    }

    handleAddTag() {
        this.setState({savingTag:true}, ()=> {
            addTag(this.state.curTag, (response) => {
                this.setState({savingTag:false}, ()=> {
                    if (response.success) {
                        let newTag = response.tag;
                        let tags = this.state.tags;
                        let tagTypeList = tags[newTag.type];
                        tagTypeList.push(cloneDeep(newTag));
                        this.setState({curTag:cloneDeep(newTag)});
        
                        tags[newTag.type] = tagTypeList;
                        this.setState({tags:tags}, ()=> {
                            window.sessionStorage.setItem('tags', JSON.stringify(this.state.tags));
                            this.updateDisplayedTags();
                            alert(response.message);
                        });
                    } else {
                        console.error(response.message);
                        alert('Could not save tag - \n' + response.message);
                    }
                });
            });
        });
    }

    handleUpdateTag(tags) {
        this.setState({savingTag:true}, ()=> {
            updateTag(tags, (response)=> {
                this.setState({savingTag:false}, ()=> {
                    if (response.success) {
                        let newTag = response.tag;
                        let tags = this.state.tags;
                        let tagTypeList = tags[newTag.type];
                        let check = tagTypeList.filter(tag=> {
                            return tag._id === newTag._id;
                        })[0];
        
                        /* 
                        When updating a tag name, go through the questions stored in local storage and 
                        change any instance of the old tag name to the new tag name for the corresponding
                        type.
                        */
                        let qfs = window.sessionStorage.getItem('questions');
                        let previousQFS = window.sessionStorage.getItem('previous_question');
                        if (qfs !== null) {
                            let questions = JSON.parse(qfs);
                            questions.forEach(question => {
                                if (question.tags[newTag.type] === check.name) {
                                    question.tags[newTag.type] = newTag.name;
                                }
                            });
                            window.sessionStorage.setItem('questions', JSON.stringify(questions));
                        }
        
                        if (previousQFS !== null) {
                            let question = JSON.parse(previousQFS);
                            if (question.tags[newTag.type] === check.name) {
                                question.tags[newTag.type] = newTag.name;
                                window.sessionStorage.setItem('previous_question', JSON.stringify(question));
                            }
                        }

                        if (newTag.type === 'department') {
                            let cfs = window.sessionStorage.getItem('contacts')
                            let previousCFS = window.sessionStorage.getItem('previous_contact')
                            if (cfs !== null) {
                                let contacts = JSON.parse(cfs);
                                contacts.forEach(contact => {
                                    if (contact.departments !== undefined) {
                                        let check = contact.departments.findIndex(dep=> {
                                            return dep._id === newTag._id;
                                        });
                                        if (check !== -1) {
                                            contact.departments[check].name = newTag.name;
                                        }
                                    }
                                });
                                window.sessionStorage.setItem('contacts', JSON.stringify(contacts));
                            }

                            if (previousCFS !== null) {
                                let contact = JSON.parse(previousCFS);
                                if (contact.departments !== undefined) {
                                    let check = contact.departments.findIndex(dep=> {
                                        return dep._id === newTag._id;
                                    });
                                    if (check !== -1) {
                                        contact.departments[check].name = newTag.name;
                                        window.sessionStorage.setItem('previous_contact', JSON.stringify(contact));
                                    }
                                }
                            }
                        }
                        
                        tagTypeList[tagTypeList.indexOf(check)] = newTag;
                        tags[newTag.type] = tagTypeList;
                        this.setState({tags:tags, curTag:cloneDeep(newTag)}, ()=> {
                            window.sessionStorage.setItem('tags', JSON.stringify(this.state.tags));
                            this.updateDisplayedTags();
                            alert(response.message);
                        });
        
                    } else {
                        console.error(response.message);
                        alert('Could not save tag - \n' + response.message);
                    }
                });
            });
        });
    }

    handleSave(event) {
        event.preventDefault();
        if (this.canSave() && this.state.curTag._id === '') {
            confirmAlert({
                title:'Are you sure you want to save these changes?',
                message: '',
                buttons: [
                    {
                        label: 'Yes, please save',
                        onClick: ()=> this.handleAddTag()
                    },
                    {
                        label: 'Cancel',
                        onClick: ()=>{}
                    }
                ]
            });

        } else if (this.canSave()) {
            let tagUpdate = {
                newTag:this.state.curTag, 
                oldTag:this.concatTags().filter(tag=> {
                return tag._id === this.state.curTag._id;
                })[0]
            }
            checkTypeDependents(tagUpdate, (dependents)=> {
                if (!dependents.hasDependents) {
                    confirmAlert({
                        title:'Are you sure you want to save these changes?',
                        message: '',
                        buttons: [
                            {
                                label: 'Yes, please save',
                                onClick: ()=> this.handleUpdateTag(tagUpdate)
                            },
                            {
                                label: 'Cancel',
                                onClick: ()=>{}
                            }
                        ]
                    });
                } else {
                    confirmAlert({
                        title:'Cannot change tag type, you have questions that depend on this tag having its current type.',
                        message: 'Would you like to create a new tag instead?',
                        buttons: [
                            {
                                label: 'Yes, create new tag',
                                onClick: ()=> this.handleAddTag()
                            },
                            {
                                label: 'Cancel',
                                onClick: ()=>{}
                            }
                        ]
                    });
                }
            }); 
        }
    }

    handleDelete(event) {
        event.preventDefault();
        checkDependents(this.state.curTag, (dependents)=> {
            if (!dependents.hasDependents) {
                confirmAlert({
                    title:'Are you sure you want to delete this tag?',
                    message:'',
                    buttons: [
                        {
                            label: 'Yes, delete tag',
                            onClick: ()=> this.setState({deletingTag:true}, ()=> {
                                deleteTag(this.state.curTag, (response)=> {
                                    this.setState({deletingTag:false}, ()=> {
                                        if (response.success) {
                                            let tags = this.state.tags;
                                            let remaining = tags[this.state.curTag.type].filter(tag=>
                                                tag._id !== this.state.curTag._id
                                            );
                                            tags[this.state.curTag.type] = remaining;

                                            if (this.state.curTag.type === 'department') {
                                                let cfs = window.sessionStorage.getItem('contacts');
                                                let previousCFS = window.sessionStorage.getItem('previous_contact');

                                                if (cfs !== null) {
                                                    let contacts = JSON.parse(cfs);
                                                    contacts.forEach(contact=> {
                                                        if (contact.departments !== undefined) {
                                                            let check = contact.departments.findIndex(dep=> {
                                                                return dep._id === this.state.curTag._id;
                                                            });
                                                            if (check !== -1) {
                                                                contact.departments.splice(check, 1);
                                                                if (contact.departments.length === 0) {
                                                                    delete contact.departments;
                                                                }
                                                            } 
                                                        }
                                                    });
                                                    window.sessionStorage.setItem('contacts', JSON.stringify(contacts));
                                                }

                                                if (previousCFS !== null) {
                                                    let contact = JSON.parse(previousCFS);
                                                    if (contact.departments !== undefined) {
                                                        let check = contact.departments.findIndex(dep=> {
                                                            return dep._id === this.state.curTag._id;
                                                        });
                                                        if (check !== -1) {
                                                            contact.departments.splice(check, 1);
                                                            if (contact.departments.length === 0) {
                                                                delete contact.departments;
                                                            }
                                                            window.sessionStorage.setItem('previous_contact', JSON.stringify(contact));
                                                        }
                                                    }
                                                }
                                            }

                                            this.setState({tags:tags, curTag:cloneDeep(defaultTag)}, ()=> {
                                                this.updateDisplayedTags();
                                                window.sessionStorage.setItem('tags', JSON.stringify(this.state.tags));
                                                alert(response.message);
                                            });
                                        } else {
                                            console.error(response.message);
                                            alert(response.message);
                                        }
                                    });
                                });
                            })
                        },
                        {
                            label: 'Cancel',
                            onClick: ()=> {}
                        }
                    ]
                });
            } else {
                alert('Cannot delete a tag that is currently being used by a question.\n'+
                'The following questions use this tag:\n' + dependents.dependentQuestions.join('\n'));
            }
        });
    }

    render() {
        return (
            <>
                <div id="content-wrapper">
                    <div id='tag-and-type-selection'>
                        <div id='type-selection'>
                            <div className='type-section-title'>
                                Types
                            </div>
                            <div className='selection-wrapper'>
                                <SelectionBox 
                                    name='tag-types' 
                                    content={['all'].concat(tagTypes).map((tag, index)=>({
                                        _id:index,
                                        name:tag
                                    }))}
                                    titles={['all'].concat(tagTypes).map(tag=>({
                                        title:tag,
                                        name:''
                                    }))}
                                    update={this.selectType}
                                    curItem={{
                                        _id:this.state.curType === 'all' ? 0 : (tagTypes.indexOf(this.state.curType) + 1),
                                        name:this.state.curType
                                    }}
                                />
                                
                            </div>
                        </div>
                        <div id='tag-selection'>
                            <div className='tag-section-title section-title'>
                                Tags
                            </div>
                            <div id='search-bar-wrapper'>
                                <input id='search-bar' type='text' placeholder='Search' onChange={this.filterSearch}/>
                            </div>
                            <div className='selection-wrapper'>
                                <SelectionBox 
                                    name='tags' 
                                    content={this.state.displayedTags}
                                    titles={this.state.displayedTags.map(tag=>({
                                        title:tag.name,
                                        name:tag.type
                                    }))}
                                    update={this.selectItem}
                                    curItem={this.state.curTag}
                                />
                                <div id='add-tag-button' onClick={(e)=>this.selectItem(e, defaultTag)}>
                                    +
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id='tag-content-body'>
                        <div id='tag-selection-header'>
                            <div id='tag-title'>
                                <label id='tag-label' htmlFor='tag-name'>
                                    Tag Name
                                </label>
                                <input 
                                type='text' 
                                className={'tag-name text-box' + (this.hasValidChanges() ? '' : ' invalid')} 
                                id='tag-name' 
                                value={this.state.curTag.name} 
                                onChange={(e)=>{
                                    e.preventDefault();
                                    let tag = this.state.curTag;
                                    tag.name = e.target.value;
                                    this.setState({curTag:tag});
                                }}
                                />
                            </div>
                            <div id='tag-save'>
                                {this.canSave() || this.state.savingTag ? <div 
                                    id='tag-save-button'
                                    className={'button save-button ' + (this.canSave() ? "selectable" : "non-selectable")}
                                    onClick={this.handleSave}
                                >
                                    {this.state.savingTag ? 'Saving...' :
                                    this.state.curTag._id === '' ? 'Save Tag' : 'Save Changes'}
                                </div> : ''
                                }
                                
                            </div>
                        </div>
                        <div id='tag-content'>
                            <div id='tag-type-display'>
                                <label id='type-label' htmlFor='tag-type'>
                                    Tag Type
                                </label>
                                <Select 
                                id='tag-type'
                                value={
                                    this.state.curTag.type === '' ? '' :
                                    {value:this.state.curTag.type, label:this.state.curTag.type}
                                }
                                options={tagTypes.map(t=>({
                                    value:t,
                                    label:t
                                }))}
                                onChange={this.handleSelectType}
                                />
                            </div>
                            <div id='tag-delete'>
                                {this.state.curTag._id !== '' ? 
                                    <div id='tag-delete-button' className='button delete-button' onClick={this.handleDelete}>
                                        {this.state.deletingTag ? 'Deleting...' : 'Delete Tag'}
                                    </div>:''
                                }
                                
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}