import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Error from './ErrorMessage';
import {CURRENT_USER_QUERY} from './User'

const SIGNOUT_MUTATION = gql`
    mutation SIGNOUT_MUTATION {
    signout {
        message
    }}
`

class Signout extends Component {
  render() {
    return (
        <Mutation
        mutation={SIGNOUT_MUTATION}
        refetchQueries={[
            { query: CURRENT_USER_QUERY}]}
        >
        {(signout) => { 
           return( 
            <button onClick={signout}>Sign Out</button>
            )
        }}
        </Mutation>
    )
  }
}

export default  Signout;