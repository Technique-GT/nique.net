import axios from "axios";

const BASE_URL='https://jsonfakery.com';

const getPost=axios.get(BASE_URL+'/blogs');

export default{
    getPost
}