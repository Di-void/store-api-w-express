const Product = require("../models/product");

const getAllProductsStatic = async (req, res) => {
  const search = "ab";
  const products = await Product.find({
    name: { $regex: search, $options: "i" },
  });

  res.status(200).json({ products, nbHits: products.length });
};

const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, fields, numericFilters } = req.query;

  const queryObj = {};

  if (featured) {
    queryObj.featured = featured === "true" ? true : false;
  }
  if (company) {
    queryObj.company = company;
  }
  if (name) {
    queryObj.name = { $regex: name, $options: "i" };
  }
  if (numericFilters) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g;
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );
    // fields available for numeric filtering
    const options = ["price", "rating"];
    filters = filters.split(",").forEach((item) => {
      const [field, opr, value] = item.split("-");
      if (options.includes(field)) {
        queryObj[field] = { [opr]: Number(value) };
      }
    });
  }

  console.log(queryObj);
  let result = Product.find(queryObj);
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("created_at");
  }

  if (fields) {
    const fieldsList = fields.split(",").join(" ");
    result = result.select(fieldsList);
  }
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  // pagination logic
  // using mongoose skip, we can skip a certain amounts of documents
  // logic goes thus: if user passed in a value for page and limit
  // e.g 7(limit) and 2(page)
  // skip value would be equalt to the page value subtracted by 1 times the limit
  // in this example, skip value would be 2 - 1 = 1 * 7 == 7
  // so the result would be documents with 7 of them being skipped
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);
  // 23
  const products = await result;
  res.status(200).json({ products, nbHits: products.length });
};

module.exports = { getAllProducts, getAllProductsStatic };
