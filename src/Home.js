import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from "./Config.json";
import { json } from 'react-router-dom';

function Home() {
  const userTypeJSON = JSON.parse(localStorage.getItem("currentUserType"));
  const userType = userTypeJSON.userType;
  if (userType !== 'user' && userType !== undefined) {
    return (
      <div>
        <div id='home-body' className='grid-home-container'>
          <Products/>
        </div>
      </div>
    );
  } else {
    return (<div>
      You don't have acces to this page.
    </div>)
  }
}

const Products = () => {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState();
  const [quantity, setQuantity] = useState();
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imageHover, setImageHover] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [option, setOption] = useState('Add');
  const [currentId, setCurrentId] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    getProducts();
  }, []);

  const getProducts = async () => {
    try {
      const response = await axios.get(`${config.Configuration.database}/product`);
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const editProduct = async () => {
    const id = currentId;
    if (
       name.length > 0 &&
       price > 0 &&
       quantity > 0 &&
       description.length > 0 
       ) {
        
        if (option === "Add") {
          try {
          await axios.post(`${config.Configuration.database}/product`, {
            name,
            description,
            isDeleted: false,
            price,
            quantity,
            image,
            imageHover
          });
          getProducts();
          setName('');
          setDescription('');
          setPrice('');
          setQuantity('');
          setImage('');
          setImageHover('');
          setMessage('Created!!');
          setTimeout(() => {
            setMessage('');
          }, 2000)
        } catch (error) {
          console.error(error);
        }
      } else if (option === "Change") {
        try {
          await axios.put(`${config.Configuration.database}/product/${id}`, {
            name,
            description,
            isDeleted: false,
            price,
            quantity,
            image,
            imageHover
          });
          getProducts();
          setName('');
          setDescription('');
          setPrice('');
          setQuantity('');
          setImage('');
          setImageHover('');
          setOption('Add');
          setMessage('Changed!!');
          setTimeout(() => {
            setMessage('');
          }, 2000)
        } catch (error) {
          console.error(error);
        }
      }
      } else {
        setMessage("Please don't leave blanks")
        setTimeout(() => {
          setMessage('');
        }, 2000)
      }
  };

  const deleteProduct = (id) => {
    products.map(async (prod) => {
      if (prod.id === id) {
        try {
          await axios.put(`${config.Configuration.database}/product/${id}`, {
            name: prod.name,
            description: prod.description,
            isDeleted: true,
            price: prod.price,
            quantity: prod.quantity,
            image: prod.image,
            imageHover: prod.imageHover
          });
          getProducts();
        } catch (error) {
          console.error(error);
        }
      }
    })
    
  };

  const updateProduct = (id) => {
    setCurrentId(id);
    products.map((prod) => {
      if (prod.id === id) {
        setName(prod.name);
        setDescription(prod.description);
        setPrice(prod.price);
        setQuantity(prod.quantity);
        setImage(prod.image);
        setImageHover(prod.imageHover);
      }
    })
    setOption('Change');
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      getProducts();
    } else {
      const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProducts(filteredProducts);
    }
  }, [searchQuery, products]);

  return (
    <div className='product-container'>
      <div className='grid-product product-description-wrapper'>
          <h2 className='prod-label'>Post Product</h2>
        <label htmlFor='product-name label-first'>Product name:</label>
        <input
          className='inp-product-name'
          type='text'
          name='product-name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Name'
        />
        <label htmlFor='product-price'>Product price:</label>
        <input
          className='inp-product-price'
          type='number'
          name='product-price'
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder='Price'
        />
        <label htmlFor='product-quantity'>Product quantity:</label>
        <input
          className='inp-product-quantity'
          type='number'
          name='product-quality'
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder='Quantity'
        />
        <p style={{color: "#f7860e"}}>Optional:</p>
        <br></br>
        <label htmlFor='product-quantity'>1/1 image link</label>
        <input
          className='inp-product-quantity'
          type='text'
          name='product-quality'
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder='Link here'
        />
        <label htmlFor='product-quantity'>1/4 image link</label>
        <input
          className='inp-product-quantity'
          type='text'
          name='product-quality'
          value={imageHover}
          onChange={(e) => setImageHover(e.target.value)}
          placeholder='Link here'
        />
        <label htmlFor='product-description'>Product description</label>
        <textarea
          className='inp-product-description'
          type='text'
          name='product-description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Description'
          rows={4}
          cols={40}
        />
        <button className='create-product-bttn' onClick={editProduct}>
          {option ?? option}
        </button>
        <p style={{
          color: '#f7860e'
        }}>{message ?? message}</p>
      </div>

      <div className='grid-product product-post-data-wrapper'>
        
          <h2 className='prod-label'>Product Description:</h2>

        <div className='search-form'>
          <input
            className='search-bar'
            type='text'
            name='search-bar'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search the product'
          />
          <i className='bx bx-search search-icon' ></i>
        </div>

        <div className='overflow-product-description'>
          {products.length === 0 && <p className='not-found'>None</p>}
          {products.map((product) => {
          if (product.isDeleted) {
            return null; 
          }
        
          return (
            <div className={`product-info`} key={product.id}>
               <div className="image-container" style={{ backgroundColor: product.image ? '' : '#121212' }}>
                 {product.image && <img src={product.image} alt="none" className="product-image" />}
               </div>
              <div className='text-container'>
                <p className='product-name-text'>{product.name}</p>
                <div className='product-price-text'>₱{product.price}</div>
                <p className='product-description-text'>{product.description}</p>
                <div className='buttons-container'>
                  <button className='update-product-bttn' onClick={() => updateProduct(product.id)}>
                    <div>{option === "Change" && product.id === currentId ? "Changing..." : "Change"}</div>
                    <i className='bx bx-message-alt-detail mess-detail'></i>
                  </button>
                  <button className='delete-product-bttn' onClick={() => deleteProduct(product.id)}>
                    <div>Delete</div>
                    <i className='bx bx-message-alt-minus mess-minus'></i>
                  </button>
                  <span className='product-quantity-text'>{product.quantity}</span>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
