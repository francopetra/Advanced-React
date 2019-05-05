import React, { Component } from 'react'
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { ALL_ITEMS_QUERY } from './Items'

const DELETE_ITEM_MUTATION = gql`
    mutation DELETE_ITEM_MUTATION($id: ID!) {
        deleteItem(id: $id) {
            id
        }
}
`

class DeleteItem extends Component {
    
    update = (cache, payload) => {
        //Manually update the cache t o sync with server
        //1. read the items from the cache. 
        const data = cache.readQuery({ query: ALL_ITEMS_QUERY});
        //2. Filter eleted item out of the page
        data.items = data.items.filter(item => item.id !== payload.data.deleteItem.id)
        //3. Restore items w/o the one we want to delete
        cache.writeQuery({ query: ALL_ITEMS_QUERY, data})
    }

  render() {
    return (
        <Mutation 
        mutation={DELETE_ITEM_MUTATION}
        variables={{id: this.props.id}}
        update={this.update}> 
        {(deleteItem, {error}) => (
      <button 
      onClick={() => {
      if (confirm('Are you sure you want to delete this?')) {
          deleteItem().catch(err => {
            alert(err.message)
          });
      }
    }}>
        {this.props.children}
      </button>
        )}
        </Mutation>
    )
  }
}

export default  DeleteItem;