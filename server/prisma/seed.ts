import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CORE_UNIVERSITIES = [
  { name: 'Sant Baba Bhag Singh University (SBBSU)', city: 'Jalandhar', country: 'India' },
  { name: 'Lovely Professional University (LPU)', city: 'Phagwara', country: 'India' },
  { name: 'Delhi University', city: 'New Delhi', country: 'India' },
];

const VENDOR_DATA = [
  {
    name: "Haldiram's",
    email: "haldirams@foodzie.com",
    description: "Traditional Indian sweets, snacks and multi-cuisine restaurant",
    categories: [
      {
        name: "Street Food & Chaat",
        items: [
          { name: "Raj Kachori", price: 120, isVegetarian: true, description: "King of chaats, crispy shell stuffed with goodies" },
          { name: "Pani Puri", price: 60, isVegetarian: true, description: "8 pcs of crispy puris with tangy water" }
        ]
      },
      {
        name: "Traditional Sweets",
        items: [
          { name: "Kaju Katli 250g", price: 250, isVegetarian: true, description: "Premium cashew fudge" },
          { name: "Rasgulla 2pcs", price: 60, isVegetarian: true, description: "Soft and spongy syrup-filled balls" }
        ]
      },
      {
        name: "North Indian Thalis",
        items: [
          { name: "Special Deluxe Thali", price: 280, isVegetarian: true, description: "Paneer, Dal, Veg, Rice, Roti, Raita, Sweet" },
          { name: "Mini Jain Thali", price: 190, isVegetarian: true, description: "No onion, no garlic meal" }
        ]
      },
      {
        name: "South Indian",
        items: [
          { name: "Masala Dosa", price: 140, isVegetarian: true, description: "Crispy crepe with potato filling" },
          { name: "Idli Sambar", price: 90, isVegetarian: true, description: "Steamed rice cakes with lentil soup" }
        ]
      },
      {
        name: "Indo-Chinese",
        items: [
          { name: "Veg Hakka Noodles", price: 160, isVegetarian: true, description: "Stir-fried noodles with veggies" },
          { name: "Chilli Paneer Dry", price: 190, isVegetarian: true, description: "Spicy paneer cubes with peppers" }
        ]
      },
      {
        name: "Breads & Parathas",
        items: [
          { name: "Aloo Paratha with Curd", price: 110, isVegetarian: true, description: "Stuffed potato flatbread" },
          { name: "Chole Bhature", price: 140, isVegetarian: true, description: "Spicy chickpeas with fried bread" }
        ]
      },
      {
        name: "Rice & Biryani",
        items: [
          { name: "Veg Pulao", price: 130, isVegetarian: true, description: "Fragrant rice with mixed vegetables" },
          { name: "Paneer Biryani", price: 180, isVegetarian: true, description: "Aromatic rice with spiced paneer" }
        ]
      },
      {
        name: "Fresh Beverages",
        items: [
          { name: "Sweet Lassi", price: 70, isVegetarian: true, description: "Refreshing yogurt-based drink" },
          { name: "Mango Shake", price: 90, isVegetarian: true, description: "Thick and creamy mango delight" }
        ]
      },
      {
        name: "Packaged Namkeen",
        items: [
          { name: "Aloo Bhujia 400g", price: 100, isVegetarian: true, description: "Crispy potato noodles" },
          { name: "Moong Dal 200g", price: 50, isVegetarian: true, description: "Fried salty lentils" }
        ]
      },
      {
        name: "Packaged Syrups",
        items: [
          { name: "Roohafza Bottle", price: 160, isVegetarian: true, description: "Classic rose syrup" },
          { name: "Khus Syrup", price: 150, isVegetarian: true, description: "Refreshing vetiver syrup" }
        ]
      }
    ]
  },
  {
    name: "Domino's Pizza",
    email: "dominos@foodzie.com",
    description: "World's leading pizza delivery brand",
    categories: [
      {
        name: "100% Veg Pizzas",
        items: [
          { name: "Margherita Regular", price: 109, isVegetarian: true, description: "Classic cheese and tomato" },
          { name: "Peppy Paneer Medium", price: 459, isVegetarian: true, description: "Paneer, capsicum, red paprika" }
        ]
      },
      {
        name: "Non-Veg Supreme Pizzas",
        items: [
          { name: "Chicken Dominator Medium", price: 599, isVegetarian: false, description: "Loaded with double chicken" },
          { name: "Pepper BBQ Chicken", price: 449, isVegetarian: false, description: "Pepper barbecue chicken with onion" }
        ]
      },
      {
        name: "Pizza Mania (Value)",
        items: [
          { name: "Tomato Pizza", price: 59, isVegetarian: true, description: "Value pizza with tomato" },
          { name: "Chicken Sausage Pizza", price: 89, isVegetarian: false, description: "Chicken sausage on a budget" }
        ]
      },
      {
        name: "Garlic Breads & Starters",
        items: [
          { name: "Garlic Breadsticks", price: 109, isVegetarian: true, description: "Classic side with cheesy dip" },
          { name: "Stuffed Garlic Bread", price: 159, isVegetarian: true, description: "Stuffed with corn and jalapeños" }
        ]
      },
      {
        name: "Burger Pizzas",
        items: [
          { name: "Classic Veg Burger Pizza", price: 109, isVegetarian: true, description: "Looks like a burger, tastes like a pizza" },
          { name: "Premium Chicken Burger Pizza", price: 149, isVegetarian: false, description: "Chicken patty inside pizza bun" }
        ]
      },
      {
        name: "Baked Pastas",
        items: [
          { name: "Veg Zingy Parcel", price: 59, isVegetarian: true, description: "Paneer stuffed snack" },
          { name: "Non-Veg Pasta Italiano", price: 169, isVegetarian: false, description: "White sauce pasta with chicken" }
        ]
      },
      {
        name: "Chicken Wings",
        items: [
          { name: "Roasted Chicken Wings", price: 199, isVegetarian: false, description: "Classic roasted wings" },
          { name: "Peri-Peri Wings", price: 209, isVegetarian: false, description: "Spicy peri-peri marinated wings" }
        ]
      },
      {
        name: "Dips & Ketchup",
        items: [
          { name: "Cheesy Dip", price: 25, isVegetarian: true, description: "Creamy cheese dip" },
          { name: "Jalapeno Dip", price: 25, isVegetarian: true, description: "Spicy jalapeno flavored dip" }
        ]
      },
      {
        name: "Choco Desserts",
        items: [
          { name: "Choco Lava Cake", price: 109, isVegetarian: true, description: "Molten chocolate center" },
          { name: "Red Velvet Lava Cake", price: 129, isVegetarian: true, description: "Red velvet with white chocolate" }
        ]
      },
      {
        name: "Cold Beverages",
        items: [
          { name: "Pepsi 500ml", price: 60, isVegetarian: true, description: "Soft drink" },
          { name: "Mirinda 500ml", price: 60, isVegetarian: true, description: "Orange flavored drink" }
        ]
      }
    ]
  },
  {
    name: "McDonald's",
    email: "mcdonalds@foodzie.com",
    description: "Quality food, fast service",
    categories: [
      {
        name: "Veg Burgers & Wraps",
        items: [
          { name: "McAloo Tikki", price: 55, isVegetarian: true, description: "Potato patty with spices" },
          { name: "McSpicy Paneer", price: 185, isVegetarian: true, description: "Crispy paneer patty" }
        ]
      },
      {
        name: "Chicken & Fish Burgers",
        items: [
          { name: "McSpicy Chicken", price: 195, isVegetarian: false, description: "Spicy chicken patty" },
          { name: "Filet-O-Fish", price: 170, isVegetarian: false, description: "Steamed fish fillet" }
        ]
      },
      {
        name: "French Fries & Wedges",
        items: [
          { name: "Medium Fries", price: 105, isVegetarian: true, description: "Classic salted fries" },
          { name: "Peri Peri Fries", price: 115, isVegetarian: true, description: "Fries with peri-peri mix" }
        ]
      },
      {
        name: "Happy Meals",
        items: [
          { name: "Veg Happy Meal", price: 160, isVegetarian: true, description: "McAloo Tikki + Fries + Drink + Toy" },
          { name: "Chicken Nugget Happy Meal", price: 190, isVegetarian: false, description: "4pc Nuggets + Fries + Drink + Toy" }
        ]
      },
      {
        name: "Chicken Nuggets",
        items: [
          { name: "Chicken McNuggets 6pcs", price: 145, isVegetarian: false, description: "Bite sized chicken treats" },
          { name: "Nuggets 9pcs", price: 195, isVegetarian: false, description: "Larger pack for sharing" }
        ]
      },
      {
        name: "McCafe Hot Coffees",
        items: [
          { name: "Cappuccino", price: 120, isVegetarian: true, description: "Rich and creamy coffee" },
          { name: "Hot Chocolate", price: 140, isVegetarian: true, description: "Indulgent cocoa drink" }
        ]
      },
      {
        name: "McCafe Cold Beverages",
        items: [
          { name: "Cold Coffee", price: 99, isVegetarian: true, description: "Classic chilled coffee" },
          { name: "Strawberry Shake", price: 130, isVegetarian: true, description: "Creamy fruit shake" }
        ]
      },
      {
        name: "Desserts & Soft Serves",
        items: [
          { name: "McFlurry Oreo", price: 110, isVegetarian: true, description: "Soft serve with oreo bits" },
          { name: "Soft Serve Strawberry", price: 45, isVegetarian: true, description: "Vanilla soft serve with topping" }
        ]
      },
      {
        name: "Breakfast Meals",
        items: [
          { name: "Veg McMuffin", price: 80, isVegetarian: true, description: "Veg patty and cheese in English muffin" },
          { name: "Egg & Cheese McMuffin", price: 95, isVegetarian: false, description: "Fresh egg and cheese in English muffin" }
        ]
      },
      {
        name: "Dips & Condiments",
        items: [
          { name: "Mustard Dip", price: 20, isVegetarian: true, description: "Tangy mustard sauce" },
          { name: "BBQ Dip", price: 20, isVegetarian: true, description: "Smoky BBQ sauce" }
        ]
      }
    ]
  },
  {
    name: "KFC",
    email: "kfc@foodzie.com",
    description: "It's finger lickin' good",
    categories: [
      {
        name: "Fried Chicken Buckets",
        items: [
          { name: "Hot & Crispy 4pcs", price: 450, isVegetarian: false, description: "Signature spicy fried chicken" },
          { name: "Smoky Red Chicken 4pcs", price: 460, isVegetarian: false, description: "Smoky grilled chicken" }
        ]
      },
      {
        name: "Chicken Rolls & Wraps",
        items: [
          { name: "Classic Chicken Roll", price: 119, isVegetarian: false, description: "Chicken strips in paratha" },
          { name: "Double Chicken Roll", price: 169, isVegetarian: false, description: "Extra chicken for extra hunger" }
        ]
      },
      {
        name: "Zinger Burgers",
        items: [
          { name: "Classic Zinger", price: 199, isVegetarian: false, description: "The original spicy chicken burger" },
          { name: "Tandoori Zinger", price: 209, isVegetarian: false, description: "Zinger with tandoori mayo" }
        ]
      },
      {
        name: "Veg Burgers & Rice Bowls",
        items: [
          { name: "Veg Zinger Burger", price: 179, isVegetarian: true, description: "Veg patty with zinger crunch" },
          { name: "Veg Rice Bowl", price: 169, isVegetarian: true, description: "Flavorful rice with veg gravy" }
        ]
      },
      {
        name: "Chicken Snacks",
        items: [
          { name: "Popcorn Chicken Regular", price: 129, isVegetarian: false, description: "Bite-sized chicken nuggets" },
          { name: "Chicken Strips 3pcs", price: 150, isVegetarian: false, description: "Boneless chicken strips" }
        ]
      },
      {
        name: "Dips & Sauces",
        items: [
          { name: "Tandoori Mayo", price: 25, isVegetarian: true, description: "Indian spiced mayo" },
          { name: "Sweet Chilli Dip", price: 25, isVegetarian: true, description: "Tangy sweet and spicy dip" }
        ]
      },
      {
        name: "Crushers & Beverages",
        items: [
          { name: "Virgin Mojito", price: 99, isVegetarian: true, description: "Refreshing lime and mint drink" },
          { name: "Pepsi PET", price: 60, isVegetarian: true, description: "Soft drink" }
        ]
      },
      {
        name: "Desserts",
        items: [
          { name: "Choco Mud Pie", price: 119, isVegetarian: true, description: "Rich chocolate dessert" },
          { name: "Brownie", price: 99, isVegetarian: true, description: "Classic walnut brownie" }
        ]
      },
      {
        name: "Snacks Box",
        items: [
          { name: "Chicken Snack Box", price: 199, isVegetarian: false, description: "Chicken + Fries + Drink" },
          { name: "Veg Snack Box", price: 149, isVegetarian: true, description: "Veg Burger + Fries + Drink" }
        ]
      },
      {
        name: "Box Meals",
        items: [
          { name: "Zinger Pro Box", price: 349, isVegetarian: false, description: "Complete meal with Zinger Pro" },
          { name: "Veggie Box Meal", price: 299, isVegetarian: true, description: "Complete meal with Veg Zinger" }
        ]
      }
    ]
  },
  {
    name: "Paradise Biryani",
    email: "paradise@foodzie.com",
    description: "Legendary Hyderabadi Biryani",
    categories: [
      {
        name: "Chicken Biryani",
        items: [
          { name: "Nizami Chicken Biryani", price: 399, isVegetarian: false, description: "Authentic Hyderabadi style" },
          { name: "Royal Chicken Biryani", price: 250, isVegetarian: false, description: "Value portion for single person" }
        ]
      },
      {
        name: "Mutton Biryani",
        items: [
          { name: "Special Mutton Biryani", price: 449, isVegetarian: false, description: "Rich and flavorful mutton" },
          { name: "Nizami Mutton Biryani", price: 499, isVegetarian: false, description: "Authentic nizami recipe" }
        ]
      },
      {
        name: "Veg & Egg Biryani",
        items: [
          { name: "Veg Paneer Biryani", price: 299, isVegetarian: true, description: "Biryani with paneer cubes" },
          { name: "Egg Biryani", price: 249, isVegetarian: false, description: "Biryani with boiled eggs" }
        ]
      },
      {
        name: "Tandoori Starters (Non-Veg)",
        items: [
          { name: "Chicken Tikka Kebab", price: 349, isVegetarian: false, description: "Grilled spiced chicken" },
          { name: "Mutton Seekh Kebab", price: 399, isVegetarian: false, description: "Minced mutton grilled" }
        ]
      },
      {
        name: "Tandoori Starters (Veg)",
        items: [
          { name: "Paneer Tikka", price: 299, isVegetarian: true, description: "Marinated grilled paneer" },
          { name: "Tandoori Mushroom", price: 279, isVegetarian: true, description: "Spiced grilled mushrooms" }
        ]
      },
      {
        name: "Mutton Curries",
        items: [
          { name: "Mutton Rogan Josh", price: 429, isVegetarian: false, description: "Kashmiri style mutton" },
          { name: "Mutton Kheema", price: 399, isVegetarian: false, description: "Minced mutton gravy" }
        ]
      },
      {
        name: "Chicken Curries",
        items: [
          { name: "Butter Chicken", price: 349, isVegetarian: false, description: "Classic creamy chicken" },
          { name: "Kadai Chicken", price: 329, isVegetarian: false, description: "Spicy wok-cooked chicken" }
        ]
      },
      {
        name: "Indian Breads",
        items: [
          { name: "Butter Naan", price: 50, isVegetarian: true, description: "Buttery flatbread" },
          { name: "Garlic Naan", price: 60, isVegetarian: true, description: "Garlic flavored flatbread" }
        ]
      },
      {
        name: "Traditional Desserts",
        items: [
          { name: "Double Ka Meetha", price: 129, isVegetarian: true, description: "Hyderabadi bread pudding" },
          { name: "Khubani Ka Meetha", price: 149, isVegetarian: true, description: "Apricot dessert" }
        ]
      },
      {
        name: "Accompaniments",
        items: [
          { name: "Mirchi Ka Salan", price: 40, isVegetarian: true, description: "Tangy chili gravy" },
          { name: "Mixed Raita", price: 50, isVegetarian: true, description: "Yogurt with veggies" }
        ]
      }
    ]
  },
  {
    name: "Burger King",
    email: "burgerking@foodzie.com",
    description: "Home of the Whopper",
    categories: [
      {
        name: "Veg Whoppers",
        items: [
          { name: "Veg Whopper", price: 179, isVegetarian: true, description: "Classic big veg burger" },
          { name: "Cheese Veg Whopper", price: 209, isVegetarian: true, description: "Extra cheese for extra flavor" }
        ]
      },
      {
        name: "Chicken & Mutton Whoppers",
        items: [
          { name: "Chicken Whopper", price: 199, isVegetarian: false, description: "Flame-grilled chicken burger" },
          { name: "Mutton Whopper", price: 249, isVegetarian: false, description: "Juicy mutton patty burger" }
        ]
      },
      {
        name: "Kings Collection",
        items: [
          { name: "Fiery Chicken Burger", price: 189, isVegetarian: false, description: "Spicy chicken burger" },
          { name: "Paneer Overload Burger", price: 199, isVegetarian: true, description: "Loaded with paneer cubes" }
        ]
      },
      {
        name: "Veg Starters & Fries",
        items: [
          { name: "Cheesy Fries", price: 110, isVegetarian: true, description: "Fries with cheese sauce" },
          { name: "Veggie Strips 5pcs", price: 89, isVegetarian: true, description: "Crunchy veg snacks" }
        ]
      },
      {
        name: "Chicken Snacks",
        items: [
          { name: "BK Chicken Nuggets 5pcs", price: 99, isVegetarian: false, description: "Bite-sized chicken nuggets" },
          { name: "Fiery Chicken Wings", price: 149, isVegetarian: false, description: "Spicy grilled wings" }
        ]
      },
      {
        name: "King Deals (Value)",
        items: [
          { name: "Crispy Veg Burger", price: 70, isVegetarian: true, description: "Affordable veg crunch" },
          { name: "Crispy Chicken Burger", price: 90, isVegetarian: false, description: "Affordable chicken crunch" }
        ]
      },
      {
        name: "Thick Shakes",
        items: [
          { name: "Chocolate Thick Shake", price: 149, isVegetarian: true, description: "Rich chocolate flavor" },
          { name: "Mango Shake", price: 139, isVegetarian: true, description: "Refreshing mango delight" }
        ]
      },
      {
        name: "Cold Drinks",
        items: [
          { name: "Coca Cola Medium", price: 80, isVegetarian: true, description: "Soft drink" },
          { name: "Sprite Medium", price: 80, isVegetarian: true, description: "Lemon-lime flavor" }
        ]
      },
      {
        name: "BK Cafe",
        items: [
          { name: "Iced Latte", price: 129, isVegetarian: true, description: "Chilled milk coffee" },
          { name: "Hot Mocha", price: 119, isVegetarian: true, description: "Coffee with chocolate" }
        ]
      },
      {
        name: "Desserts",
        items: [
          { name: "Choco Lava Cup", price: 99, isVegetarian: true, description: "Small chocolate treat" },
          { name: "Sundae", price: 89, isVegetarian: true, description: "Vanilla with topping" }
        ]
      }
    ]
  },
  {
    name: "Chaayos",
    email: "chaayos@foodzie.com",
    description: "Experiments with Tea",
    categories: [
      {
        name: "Hot Desi Chai",
        items: [
          { name: "Kulhad Chai", price: 120, isVegetarian: true, description: "Tea in traditional clay cup" },
          { name: "Adrak Tulsi Chai", price: 130, isVegetarian: true, description: "Ginger and basil tea" }
        ]
      },
      {
        name: "Iced Teas",
        items: [
          { name: "Lemon Iced Tea", price: 140, isVegetarian: true, description: "Refreshing citrus tea" },
          { name: "Peach Iced Tea", price: 150, isVegetarian: true, description: "Sweet peach flavored tea" }
        ]
      },
      {
        name: "Cold Coffees & Frappes",
        items: [
          { name: "Classic Cold Coffee", price: 180, isVegetarian: true, description: "Blended chilled coffee" },
          { name: "Hazelnut Frappe", price: 210, isVegetarian: true, description: "Nutty flavored frappe" }
        ]
      },
      {
        name: "Bun Maska & Breads",
        items: [
          { name: "Bun Maska", price: 79, isVegetarian: true, description: "Classic buttery bun" },
          { name: "Bun Omelette", price: 110, isVegetarian: false, description: "Bun with spicy omelette" }
        ]
      },
      {
        name: "Indian Breakfast",
        items: [
          { name: "Loaded Poha", price: 149, isVegetarian: true, description: "Beaten rice with veggies" },
          { name: "Homestyle Upma", price: 139, isVegetarian: true, description: "Savory semolina porridge" }
        ]
      },
      {
        name: "Savory Snacks",
        items: [
          { name: "Mini Samosa 4pcs", price: 99, isVegetarian: true, description: "Small snack size samosas" },
          { name: "Matar Kulcha", price: 169, isVegetarian: true, description: "Spiced peas with flatbread" }
        ]
      },
      {
        name: "Sandwiches & Wraps",
        items: [
          { name: "Paneer Thepla Tacos", price: 199, isVegetarian: true, description: "Fusion Gujarati tacos" },
          { name: "Chicken Tikka Wrap", price: 229, isVegetarian: false, description: "Spiced chicken in wrap" }
        ]
      },
      {
        name: "Street Food",
        items: [
          { name: "Pav Bhaji", price: 189, isVegetarian: true, description: "Spicy veg mash with buttery buns" },
          { name: "Vada Pav 2pcs", price: 149, isVegetarian: true, description: "Mumbai style potato slider" }
        ]
      },
      {
        name: "Packaged Tea Blends",
        items: [
          { name: "Masala Chai Patti 250g", price: 299, isVegetarian: true, description: "Loose leaf tea with spices" },
          { name: "Green Tea Box", price: 349, isVegetarian: true, description: "Healthy tea bags" }
        ]
      },
      {
        name: "Cookies & Rusk",
        items: [
          { name: "Gur Chana", price: 89, isVegetarian: true, description: "Jaggery and chickpea snack" },
          { name: "Atta Cookies", price: 99, isVegetarian: true, description: "Healthy whole wheat cookies" }
        ]
      }
    ]
  },
  {
    name: "Bikanervala",
    email: "bikanervala@foodzie.com",
    description: "The Taste of Tradition",
    categories: [
      {
        name: "Premium Mithai",
        items: [
          { name: "Kesar Rasmalai", price: 80, isVegetarian: true, description: "Saffron flavored milk dessert" },
          { name: "Moong Dal Halwa", price: 120, isVegetarian: true, description: "Rich lentil dessert" }
        ]
      },
      {
        name: "Namkeen & Savories",
        items: [
          { name: "Bhujia Sev Packet", price: 110, isVegetarian: true, description: "Classic spicy snack" },
          { name: "Navratan Mixture", price: 120, isVegetarian: true, description: "Mix of many snacks" }
        ]
      },
      {
        name: "North Indian Mains",
        items: [
          { name: "Dal Makhani", price: 220, isVegetarian: true, description: "Creamy black lentils" },
          { name: "Shahi Paneer", price: 260, isVegetarian: true, description: "Royal paneer gravy" }
        ]
      },
      {
        name: "Tandoori Snacks",
        items: [
          { name: "Malai Soy Chaap", price: 240, isVegetarian: true, description: "Creamy grilled soy chaap" },
          { name: "Tandoori Aloo", price: 210, isVegetarian: true, description: "Spiced grilled potatoes" }
        ]
      },
      {
        name: "Chaat Bhandar",
        items: [
          { name: "Papdi Chaat", price: 110, isVegetarian: true, description: "Crispy chips with yogurt and chutneys" },
          { name: "Dahi Bhalla", price: 120, isVegetarian: true, description: "Soft lentil balls in yogurt" }
        ]
      },
      {
        name: "South Indian",
        items: [
          { name: "Onion Rava Dosa", price: 160, isVegetarian: true, description: "Crispy semolina crepe" },
          { name: "Vada Sambar", price: 110, isVegetarian: true, description: "Fried savory donuts with lentil soup" }
        ]
      },
      {
        name: "Thalis & Combos",
        items: [
          { name: "Deluxe Thali", price: 320, isVegetarian: true, description: "Complete North Indian meal" },
          { name: "Chole Rice Combo", price: 180, isVegetarian: true, description: "Simple chickpea and rice meal" }
        ]
      },
      {
        name: "Continental",
        items: [
          { name: "Margherita Pizza", price: 200, isVegetarian: true, description: "Cheese and tomato pizza" },
          { name: "White Sauce Pasta", price: 220, isVegetarian: true, description: "Creamy cheesy pasta" }
        ]
      },
      {
        name: "Beverages & Shakes",
        items: [
          { name: "Badam Milk", price: 90, isVegetarian: true, description: "Traditional almond milk" },
          { name: "Fresh Lime Soda", price: 70, isVegetarian: true, description: "Refreshing citrus soda" }
        ]
      },
      {
        name: "Gift Hampers",
        items: [
          { name: "Assorted Sweets Box", price: 550, isVegetarian: true, description: "Mix of traditional sweets" },
          { name: "Dry Fruit Box", price: 850, isVegetarian: true, description: "Premium assorted dry fruits" }
        ]
      }
    ]
  },
  {
    name: "Subway",
    email: "subway@foodzie.com",
    description: "Eat Fresh",
    categories: [
      {
        name: "Veg Subs (15cm)",
        items: [
          { name: "Paneer Tikka Sub", price: 210, isVegetarian: true, description: "Spiced paneer in your choice of bread" },
          { name: "Veggie Delight Sub", price: 160, isVegetarian: true, description: "Fresh garden veggies" }
        ]
      },
      {
        name: "Non-Veg Subs (15cm)",
        items: [
          { name: "Roasted Chicken Sub", price: 230, isVegetarian: false, description: "Tender roasted chicken strips" },
          { name: "Tuna Sub", price: 250, isVegetarian: false, description: "Creamy tuna mix" }
        ]
      },
      {
        name: "Footlong Subs (Veg)",
        items: [
          { name: "Aloo Patty Footlong", price: 320, isVegetarian: true, description: "Spiced potato patty in 12-inch sub" },
          { name: "Corn & Peas Footlong", price: 340, isVegetarian: true, description: "Sweet corn and green peas mix" }
        ]
      },
      {
        name: "Footlong Subs (Non-Veg)",
        items: [
          { name: "Chicken Teriyaki Footlong", price: 450, isVegetarian: false, description: "Sweet and savory chicken" },
          { name: "Turkey Sub Footlong", price: 480, isVegetarian: false, description: "Sliced turkey breast" }
        ]
      },
      {
        name: "Signature Wraps",
        items: [
          { name: "Paneer Wrap", price: 220, isVegetarian: true, description: "Double paneer in a soft wrap" },
          { name: "Chicken Slice Wrap", price: 240, isVegetarian: false, description: "Sliced chicken in a wrap" }
        ]
      },
      {
        name: "Fresh Salads",
        items: [
          { name: "Veggie Salad Bowl", price: 200, isVegetarian: true, description: "All the sub veggies in a bowl" },
          { name: "Chicken Kofta Salad", price: 260, isVegetarian: false, description: "Chicken koftas with fresh salad" }
        ]
      },
      {
        name: "Cookies",
        items: [
          { name: "Double Chocolate Cookie", price: 60, isVegetarian: true, description: "Soft and chewy" },
          { name: "Oatmeal Raisin Cookie", price: 60, isVegetarian: true, description: "Classic healthy cookie" }
        ]
      },
      {
        name: "Toasties & Snacks",
        items: [
          { name: "Cheese Toastie", price: 90, isVegetarian: true, description: "Warm and cheesy" },
          { name: "Chicken Pepperoni Toastie", price: 120, isVegetarian: false, description: "Spicy chicken pepperoni" }
        ]
      },
      {
        name: "Bottled Beverages",
        items: [
          { name: "Diet Coke", price: 60, isVegetarian: true, description: "Sugar free soda" },
          { name: "Minute Maid Apple", price: 50, isVegetarian: true, description: "Fruit juice" }
        ]
      },
      {
        name: "Value Meals",
        items: [
          { name: "Sub of the Day Combo", price: 250, isVegetarian: true, description: "Daily special sub + drink + cookie" }
        ]
      }
    ]
  },
  {
    name: "Barbeque Nation",
    email: "bbqnation@foodzie.com",
    description: "DIY Grilling Experience",
    categories: [
      {
        name: "Veg BBQ Starters",
        items: [
          { name: "Cajun Spiced Potatoes", price: 229, isVegetarian: true, description: "Crispy fried baby potatoes" },
          { name: "Crispy Corn", price: 199, isVegetarian: true, description: "Spiced and fried corn kernels" }
        ]
      },
      {
        name: "Non-Veg BBQ Starters",
        items: [
          { name: "BBQ Chicken Wings", price: 299, isVegetarian: false, description: "Spicy grilled wings" },
          { name: "Mutton Seekh Kebab", price: 349, isVegetarian: false, description: "Minced mutton on skewers" }
        ]
      },
      {
        name: "Biryani & Rice",
        items: [
          { name: "Chicken Dum Biryani", price: 329, isVegetarian: false, description: "Flavorful chicken biryani" },
          { name: "Veg Dum Biryani", price: 269, isVegetarian: true, description: "Aromatic veg biryani" }
        ]
      },
      {
        name: "North Indian Veg Mains",
        items: [
          { name: "Paneer Butter Masala", price: 289, isVegetarian: true, description: "Classic paneer dish" },
          { name: "Dal Tadka", price: 199, isVegetarian: true, description: "Yellow lentils tempered with spices" }
        ]
      },
      {
        name: "North Indian Non-Veg Mains",
        items: [
          { name: "Mutton Rogan Josh", price: 399, isVegetarian: false, description: "Rich mutton gravy" },
          { name: "Chicken Tikka Masala", price: 349, isVegetarian: false, description: "Grilled chicken in gravy" }
        ]
      },
      {
        name: "Dal & Breads",
        items: [
          { name: "Tandoori Roti", price: 30, isVegetarian: true, description: "Whole wheat flatbread" },
          { name: "Lachha Paratha", price: 50, isVegetarian: true, description: "Layered flatbread" }
        ]
      },
      {
        name: "Indo-Chinese Mains",
        items: [
          { name: "Chilli Chicken Gravy", price: 299, isVegetarian: false, description: "Spicy Chinese style chicken" },
          { name: "Veg Fried Rice", price: 199, isVegetarian: true, description: "Wok-fried rice with veggies" }
        ]
      },
      {
        name: "Premium Desserts",
        items: [
          { name: "Angoori Gulab Jamun", price: 149, isVegetarian: true, description: "Mini syrup-filled balls" },
          { name: "Brownie with Ice Cream", price: 179, isVegetarian: true, description: "Warm brownie with vanilla scoop" }
        ]
      },
      {
        name: "Kulfi & Ice Creams",
        items: [
          { name: "Malai Kulfi", price: 99, isVegetarian: true, description: "Traditional creamy kulfi" },
          { name: "Paan Kulfi", price: 110, isVegetarian: true, description: "Betel leaf flavored kulfi" }
        ]
      },
      {
        name: "Mocktails & Coolers",
        items: [
          { name: "Blue Lagoon Mocktail", price: 149, isVegetarian: true, description: "Citrusy blue drink" },
          { name: "Peach Iced Tea", price: 139, isVegetarian: true, description: "Fruity chilled tea" }
        ]
      }
    ]
  },
  {
    name: "Sharma Snacks",
    email: "sharma@foodzie.com",
    universityName: "Sant Baba Bhag Singh University (SBBSU)",
    description: "Best snacks in Jalandhar",
    categories: [
      {
        name: "Hot Snacks",
        items: [
          { name: "Samosa", price: 15, isVegetarian: true, description: "Crispy potato pastry" },
          { name: "Bread Pakora", price: 20, isVegetarian: true, description: "Spiced fried bread" }
        ]
      },
      {
        name: "Cold Beverages",
        items: [
          { name: "Coke 250ml", price: 20, isVegetarian: true, description: "Chilled soft drink" },
          { name: "Frooti", price: 15, isVegetarian: true, description: "Mango drink" }
        ]
      }
    ]
  },
  {
    name: "Bhatia Canteen",
    email: "bhatia@foodzie.com",
    universityName: "Sant Baba Bhag Singh University (SBBSU)",
    description: "Freshly prepared campus meals",
    categories: [
      {
        name: "Lunch Specials",
        items: [
          { name: "Veg Thali", price: 80, isVegetarian: true, description: "Dal, Sabzi, Rice, 2 Roti" },
          { name: "Rajma Rice", price: 60, isVegetarian: true, description: "Home style rajma rice" }
        ]
      },
      {
        name: "Evening Bites",
        items: [
          { name: "Maggi", price: 40, isVegetarian: true, description: "Classic masala maggi" },
          { name: "Egg Maggi", price: 55, isVegetarian: false, description: "Maggi with two eggs" }
        ]
      }
    ]
  },
  {
    name: "Campus Cafe",
    email: "cafe@foodzie.com",
    universityName: "Lovely Professional University (LPU)",
    description: "Fresh coffee and sandwiches",
    categories: [
      {
        name: "Coffee & Tea",
        items: [
          { name: "Filter Coffee", price: 30, isVegetarian: true, description: "South Indian style coffee" },
          { name: "Ginger Tea", price: 15, isVegetarian: true, description: "Freshly brewed chai" }
        ]
      },
      {
        name: "Quick Bites",
        items: [
          { name: "Veg Sandwich", price: 45, isVegetarian: true, description: "Grilled veggie sandwich" },
          { name: "Cheese Grilled Sandwich", price: 65, isVegetarian: true, description: "Loaded with mozzarella" }
        ]
      }
    ]
  },
  {
    name: "DU Canteen",
    email: "du@foodzie.com",
    universityName: "Delhi University",
    description: "Affordable meals for students",
    categories: [
      {
        name: "Student Specials",
        items: [
          { name: "Bread Omelette", price: 35, isVegetarian: false, description: "Quick college breakfast" },
          { name: "Mix Veg Paratha", price: 40, isVegetarian: true, description: "Stuffed paratha with pickle" }
        ]
      },
      {
        name: "Mini Meals",
        items: [
          { name: "Chole Bhature", price: 50, isVegetarian: true, description: "Classic DU style" },
          { name: "Fried Rice", price: 60, isVegetarian: true, description: "Veg fried rice" }
        ]
      }
    ]
  }
];

const CATEGORY_IMAGES: Record<string, string> = {
  "Street Food & Chaat": "1601050690597-df056fb4ce70",
  "Traditional Sweets": "1589113155353-c90f59068b81",
  "North Indian Thalis": "1546833999-b9f581a1996d",
  "South Indian": "1631452180519-c014fe946bc7",
  "Indo-Chinese": "1512058560366-cd2427ff062f",
  "Breads & Parathas": "1606491956689-2ea866880c84",
  "Rice & Biryani": "1563379091339-03b21bc4a4f8",
  "Fresh Beverages": "1541167760496-162955ed8a9f",
  "Packaged Namkeen": "1566478989037-eec170784d0b",
  "Packaged Syrups": "1622483767028-3f66f32aef97",
  "100% Veg Pizzas": "1513104890138-7c749659a591",
  "Non-Veg Supreme Pizzas": "1565299624-8974523703a2",
  "Pizza Mania (Value)": "1593560708920-61ddf47a6a3e",
  "Garlic Breads & Starters": "1600271886312-507cd88c4d2e",
  "Veg Burgers & Wraps": "1568901346375-23c9450c58cd",
  "Chicken & Fish Burgers": "1551782450-a2132b4ba21d",
  "Fried Chicken Buckets": "1514356608106-7aa2d86994e2",
  "Chicken Biryani": "1563379091339-03b21bc4a4f8",
  "Mutton Biryani": "1633945213235-cd0c7bc13f71",
  "Hot Desi Chai": "1594631252845-29fc458631b6",
  "Veg Subs (15cm)": "1534422298391-e4f8c170db0a",
  "Veg BBQ Starters": "1541544741938-0af808891cc3",
  "Hot Snacks": "1601050690597-df056fb4ce70",
  "Lunch Specials": "1546833999-b9f581a1996d",
  "Quick Bites": "1568901346375-23c9450c58cd"
};

async function main() {
  console.log('Starting final production seed script...');

  // 0. Seed Core Universities first
  console.log('Seeding core universities...');
  for (const uni of CORE_UNIVERSITIES) {
    await prisma.university.upsert({
      where: { name: uni.name },
      update: uni,
      create: uni,
    });
  }

  // Cleanup
  console.log('Cleaning up old data...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.foodItem.deleteMany({});
  await prisma.category.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Get all unis for assignment
  const unis = await prisma.university.findMany();
  if (unis.length === 0) {
    console.error('No universities found. Please run university seed first.');
    return;
  }

  // Helper to find uni by name or pick round-robin
  const getUniId = (name?: string, index?: number) => {
    if (name) {
      const found = unis.find(u => u.name === name);
      if (found) return found.id;
    }
    return unis[index! % unis.length].id;
  };

  // 1. Seed Massive Vendors
  console.log(`Seeding ${VENDOR_DATA.length} vendors and their menus...`);
  for (let i = 0; i < VENDOR_DATA.length; i++) {
    const v = VENDOR_DATA[i] as any;
    const uniId = getUniId(v.universityName, i);

    const vendor = await prisma.user.upsert({
      where: { email: v.email },
      update: {
        name: v.name,
        vendorDescription: v.description,
        universityId: uniId
      },
      create: {
        name: v.name,
        email: v.email,
        password: hashedPassword,
        role: Role.Vendor,
        universityId: uniId,
        vendorDescription: v.description,
      },
    });

    console.log(`- Seeding menu for ${v.name}...`);
    for (const catData of v.categories) {
      const category = await prisma.category.create({
        data: {
          name: catData.name,
          vendorId: vendor.id,
        },
      });

      for (const item of catData.items) {
        const imageId = CATEGORY_IMAGES[catData.name] || "1546069901-ba9599a7e63c";
        const imageUrl = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&q=80&w=800`;

        await prisma.foodItem.create({
          data: {
            name: item.name,
            price: item.price,
            isVegetarian: item.isVegetarian,
            description: item.description,
            categoryId: category.id,
            imageUrl: imageUrl,
            isCooked: true,
          },
        });
      }
    }
  }

  // 2. Generate small order history
  console.log('Generating sample order history...');
  const students = await prisma.user.findMany({ where: { role: Role.Student }, take: 5 });
  const vendors = await prisma.user.findMany({ 
    where: { role: Role.Vendor }, 
    include: { categories: { include: { items: true } } } 
  });

  for (let i = 0; i < 30; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const items = vendor.categories.flatMap(c => c.items);
    
    if (items.length === 0) continue;

    const randomItem = items[Math.floor(Math.random() * items.length)];
    const quantity = Math.floor(Math.random() * 2) + 1;
    
    await prisma.order.create({
      data: {
        customerId: student.id,
        vendorId: vendor.id,
        totalAmount: randomItem.price * quantity,
        status: OrderStatus.Delivered,
        deliveryAddress: 'Hostel Block A, Room 302',
        items: {
          create: {
            foodItemId: randomItem.id,
            quantity,
            priceAtTime: randomItem.price,
          },
        },
      },
    });
  }

  console.log('Final production-grade seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
