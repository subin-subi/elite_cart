

const getAllOrders = async (req, res) => {
    try {
        res.render("admin/orders");
    } catch (error) {
        console.log(error);
       
    }
}

export default{ getAllOrders};
