import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Router from 'next/router'
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import formatMoney from '../lib/formatMoney';
import Form from './styles/Form';
import ErrorMessage from '../components/ErrorMessage.js'

const CREATE_ITEM_MUTATION = gql`
    mutation CREATE_ITEM_MUTATION (
        $title: String!
        $description: String!
        $price: Int!
        $image: String
        $largeImage: String
        )  {
        createItem(
        title: $title
        description: $description
        price: $price
        image: $image
        largeImage: $largeImage
        ) {
            id
        }
    }
`

class CreateItem extends Component {
    state = {
        title: 'Cool',
        description: 'Jus a typical description',
        image: null,
        largeImage: null,
        price: '1000',
    }

  handleChange = (e) => {
      const { name, type, value} = e.target;
      const val = type === 'number' ? parseFloat(value) : value;
      this.setState({
        [name]: val
      })
  }

  uploadFile = async (e) => {
      console.log('uploading...');
      const files = e.target.files;
      const data = new FormData();
      data.append('file', files[0]);
      data.append('upload_preset', 'sickfits');

      const res = await fetch(
          'https://api.cloudinary.com/v1_1/fpetra/image/upload',
          {
              method: 'POST',
              body: data,
          });
          const file = await res.json();
          //Need to check if image was saved to enable submit button.
          this.setState({
              image: file.secure_url,
              largeImage: file.eager[0].secure_url
          })
  }

  render() {
    return (
        <Mutation 
        mutation={CREATE_ITEM_MUTATION} 
        variables={this.state}>
        {(createItem, {loading, error}) => (
            <Form onSubmit={ async (e) => {
                e.preventDefault();
                const res = await createItem();
                Router.push({
                    pathname: '/item',
                    query: {id: res.data.createItem.id}
                })
            }}>
                <ErrorMessage error={error}/>
                <fieldset disabled={loading} aria-busy={loading}>

                            <label htmlFor='file'>
                            File 
                            <input 
                            type='file' 
                            id='file' 
                            name='file' 
                            placeholder='Upload an image' 
                            required 
                            onChange={this.uploadFile}
                            />
                            {this.state.image && <img src={this.state.image} width="200" alt="Upload Preview" />}
                        </label>

                        <label htmlFor='title'>
                            Title 
                            <input 
                            type='text' 
                            id='title' 
                            name='title' 
                            placeholder='Title' 
                            required 
                            value={this.state.title}
                            onChange={this.handleChange}
                            />
                        </label>

                        <label htmlFor='price'>
                            Price 
                            <input 
                            type='number' 
                            id='price' 
                            name='price' 
                            placeholder='0.00' 
                            required 
                            value={this.state.price}
                            onChange={this.handleChange}
                            />
                        </label>

                        <label htmlFor='description'>
                            Description 
                            <textarea
                            id='description' 
                            name='description' 
                            placeholder='Enter a description' 
                            required 
                            value={this.state.description}
                            onChange={this.handleChange}
                            />
                        </label>

                    <button type='submit'>Submit </button>
                </fieldset>        
            </Form>
    )}
    </Mutation>
    ) 
  }
}

export default CreateItem;
export { CREATE_ITEM_MUTATION };