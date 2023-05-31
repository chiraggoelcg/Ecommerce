const mailjet = require('node-mailjet');

const transporter = mailjet.connect(
		"2b638ea1bdded9f720d2720a7b9b2452",
		"74d108ad7ac63ba95476552cc1d9542d"
)

module.exports = function sendMail( email, title, body, html, callback )
{

  const request = transporter.post('send').request({
		FromEmail: 'xyza60847@gmail.com',
		FromName: 'Ecom Express',
		Subject: title,
		'Text-part': body,
		'Html-part': html,
		Recipients: [{Email: email}]
	})
	request
  .then(result => {
    callback(null,"success");
  })
  .catch(err => {
    callback("error occured",null);
  })

}