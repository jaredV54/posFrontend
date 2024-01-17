import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from "./Config.json";

const Home = () => {
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
  const [hybrid, setHybrid] = useState('');
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
  const currentSelectedHybrid_ = localStorage.getItem("currentSelectedHybrid_");

  if (!currentSelectedHybrid_) {
    localStorage.setItem("currentSelectedHybrid_", "all");
  }
  
  const getProducts = async () => {
    try {
      const response = await axios.get(`${config.Configuration.database}/product`, {
        params: {
          hybrid: currentSelectedHybrid_ === "all" ? null : currentSelectedHybrid_
        }
      });
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  const editProduct = async () => {
    const id = currentId;
    if (
       name.length > 0 &&
       price > 0 &&
       quantity > 0 &&
       hybrid
       ) {
        
        if (option === "Add") {
          try {
          await axios.post(`${config.Configuration.database}/product`, {
            name,
            description,
            price,
            quantity,
            image,
            imageHover,
            hybrid
          });
          getProducts();
          setName('');
          setDescription('');
          setPrice('');
          setQuantity('');
          setImage('');
          setImageHover('');
          setHybrid('');
          setMessage('Created!!');
          setTimeout(() => {
            setMessage('');
          }, 2500)
        } catch (error) {
          console.error(error);
        }
      } else if (option === "Change") {
        try {
          await axios.put(`${config.Configuration.database}/product/${id}`, {
            name,
            description,
            price,
            quantity,
            image,
            imageHover,
            hybrid
          });
          getProducts();
          setName('');
          setDescription('');
          setPrice('');
          setQuantity('');
          setImage('');
          setImageHover('');
          setHybrid('');
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
        setMessage("Please don't leave blanks or select hybrid")
        setTimeout(() => {
          setMessage('');
        }, 2000)
      }
  };

  const deleteProduct = (id) => {
    products.map(async (prod) => {
      if (prod.id === id) {
        try {
          await axios.put(`${config.Configuration.database}/deleteProduct/${id}`, {
            isDeleted: true
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
        setHybrid(prod.hybrid);
      }
    })
    setOption('Change');
  }

  const handleDescription = (e) => {
    const inputValue = e.target.value;

    const truncatedValue = inputValue.slice(0, 255);

    setDescription(truncatedValue);
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

  const hybridType = (val) => {
    setHybrid(val);
    if (val === "service") {
      setQuantity(9999999);
    } else {
      setQuantity();
    }
  }

  const handleHybridSelection = (name) => {
    localStorage.setItem("currentSelectedHybrid_", name);
  }

  return (
    <div className='product-container'>
      <div className='grid-product product-description-wrapper'>
        <h2 className='prod-label'>Manage Product/Service</h2>
        <p>Select Hybrid</p>
        <div id='hybrin_type'>
        <button id='service_type' name='service' onClick={(e) => {
          e.preventDefault();
          hybridType(e.target.name)}}
          style={{
            border: hybrid === "service" ? "3px solid #313a72" : "3px solid transparent",
            fontWeight: hybrid === "service" ? 500 : 400
          }}>
          Service
        </button>
        <button id='product_type' name='product' onClick={(e) => {
          e.preventDefault();
          hybridType(e.target.name)}}
          style={{
            border: hybrid === "product" ? "3px solid #f7860e" : "3px solid transparent",
            fontWeight: hybrid === "product" ? 500 : 400
          }}>
          Product
        </button>
        </div>
        <label htmlFor='product-name label-first'>Name:</label>
        <input
          className='inp-product-name'
          type='text'
          name='product-name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='---'
        />
        <label htmlFor='product-price'>Initial Price</label>
        <input
          className='inp-product-price'
          type='number'
          name='product-price'
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder='---'
        />
        {hybrid === "product" ? (
          <>
          <label htmlFor='product-quantity'>Quantity:</label>
          <input
          className='inp-product-quantity'
          type='number'
          name='product-quality'
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder='---'
          />
          </>
        ): null}
        <p style={{color: "#f7860e"}}>Optional</p>
        <br></br>
        <label htmlFor='product-quantity'>Your product image</label>
        <input
          className='inp-product-quantity'
          type='text'
          name='product-quality'
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder='Link here'
        />
        <label htmlFor='product-quantity'>Close up image of your product/service</label>
        <input
          className='inp-product-quantity'
          type='text'
          name='product-quality'
          value={imageHover}
          onChange={(e) => setImageHover(e.target.value)}
          placeholder='Link here'
        />
        <label htmlFor='product-description'>Description</label>
        <textarea
          className='inp-product-description'
          type='text'
          name='product-description'
          value={description}
          onChange={handleDescription}
          placeholder='(Limit 255 characters)'
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
        <div className='search-form'>
          <input
            className='search-bar'
            type='text'
            name='search-bar'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search'
          />
          <i className='bx bx-search search-icon' ></i>
        </div>
  
        <ul id='hybrid_selection'>
          <li className={currentSelectedHybrid_ === "all" ? "selectedHybrid" : ""} data-hybrid="all" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>All</li>
          <li className={currentSelectedHybrid_ === "service" ? "selectedHybrid" : ""} data-hybrid="service" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>Services</li>
          <li className={currentSelectedHybrid_ === "product" ? "selectedHybrid" : ""} data-hybrid="product" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>Products</li>
          <div
          style={{
            position: "absolute",
            bottom: "-10px",
            left: currentSelectedHybrid_ === "all" ? "35px" : currentSelectedHybrid_ === "service" ? "145px" : "255px"
          }}
            className='hybrid_selection_bar'
          ></div>
        </ul>

        <div className='overflow-product-description'>
          {products.length === 0 && <p className='not-found'>None</p>}
          {products.map((product) => {
            if (product.isDeleted) {
              return null;
            }
          
            if (currentSelectedHybrid_ === "all" || currentSelectedHybrid_ === product.hybrid) {
              return (
                <div key={product.id}>
                  {filterProductsByHybrid(product, updateProduct, option, currentId, deleteProduct)}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};

const filterProductsByHybrid = (product, updateProduct, option, currentId, deleteProduct) => {
  return (
    <>
    <div className={`product-info`}>
               <div className="image-container" style={{ backgroundColor: product.image ? '' : '#121212' }}>
                 {product.image && <img src={product.image} alt="none" className="product-image" />}
               </div>
              <div className='text-container'>
                <p className='product-name-text'>{product.name}</p>
                <div className='product-price-text'>₱{product.price}</div>
                {
                  product.hybrid === "product" ? (
                    <div className='product-quantity-text'>{product.quantity} qty</div>
                  ): null
                }
                <div className='product-description-text'>{product.description}</div>
                <div className='buttons-container'>
                  <button className='update-product-bttn' onClick={() => updateProduct(product.id)}>
                    <div>{option === "Change" && product.id === currentId ? "Changing..." : "Change"}</div>
                    <i className='bx bx-message-alt-detail mess-detail'></i>
                  </button>
                  <button className='delete-product-bttn' onClick={() => deleteProduct(product.id)}>
                    <div>Delete</div>
                    <i className='bx bx-message-alt-minus mess-minus'></i>
                  </button>
                 
                </div>
              </div>
            </div>
    </>
  )
}

export default Home;