// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco



function BinaryExpressionTree(am, w, h)
{
	this.init(am, w, h);
}

BinaryExpressionTree.prototype = new Algorithm();
BinaryExpressionTree.prototype.constructor = BinaryExpressionTree;
BinaryExpressionTree.superclass = Algorithm.prototype;

BinaryExpressionTree.prototype.tree = null;
BinaryExpressionTree.prototype.has_hard_reset = false;
BinaryExpressionTree.prototype.recent_postfix = null;
BinaryExpressionTree.prototype.STANDARD_SPACE = 50;
BinaryExpressionTree.prototype.intitial_point = {"x":50,"y":100};
BinaryExpressionTree.prototype.stack = [];

BinaryExpressionTree.prototype.init = function(am, w, h)
{
	// Call the unit function of our "superclass", which adds a couple of
	// listeners, and sets up the undo stack
	BinaryExpressionTree.superclass.init.call(this, am, w, h);

	this.addControls();

	// Useful for memory management
	this.nextIndex = 0;

	// TODO:  Add any code necessary to set up your own algorithm.  Initialize data
	// structures, etc.

}

function BSTNode(val, id, initialX, initialY)
{
	this.data = val;
	this.x = initialX;
	this.y = initialY;
	this.id = id;
	this.left = null;
	this.right = null;
	this.parent = null;
	this.hasChild = function(){
		return this.left != null || this.right != null;
	};
}

BinaryExpressionTree.prototype.isPostfixValid = function(postfix){

	if(this.isSpecialCharacter(postfix[0]) || !this.isSpecialCharacter(postfix[postfix.length - 1])){
		return false;
	}
	let operand_count = 0;
	let operator_count = 0;
	for(var i = 0; i< postfix.length; i++){
		if(!this.isSpecialCharacter(postfix[i])){
			operand_count++;
		}else {
			operator_count++;
		}
	}
	console.log(operator_count + " " + operand_count);
	return operator_count == operand_count - 1;
}

BinaryExpressionTree.prototype.isSpecialCharacter = function(c){
	return c.search(/[-+/^*]/) != -1;
}



BinaryExpressionTree.prototype.loadNodes = function(text){
	this.commands = [];
	let parent = null;

	this.partialReset();
	this.animationManager.animatedObjects.clearAllObjects();
	this.stack = [];

	this.recent_postfix = text;
	this.has_hard_reset = false;
	let instance = this;
	let moveTree = function(tree,x,y){
		tree.x = tree.x+x;
		tree.y = tree.y+y;
		instance.cmd("Move",tree.id,tree.x+x,tree.y+y);
		if(tree.left != null){
			moveTree(tree.left,x,y);
		}
		if(tree.right != null){
			moveTree(tree.right,x,y);
		}
	}

	let moveSubtrees = function(){
		for(var i =0; i < instance.stack.length; i++){
			moveTree(instance.stack[i],0,instance.STANDARD_SPACE);
		}
	}

	for(var v =0; v < text.length; v++){
		var circleID = this.nextIndex++;
		this.cmd("Step");
		if(!this.isSpecialCharacter(text[this.nextIndex - 1])){
			let value = text[this.nextIndex - 1] + "";
			this.intitial_point.x+= 50;
			this.cmd("CreateCircle", circleID,value, this.intitial_point.x,this.intitial_point.y);
			let node = new BSTNode(value,circleID,this.intitial_point.x,this.intitial_point.y);
			this.stack.push(node);

		} else {
			let value = text[this.nextIndex - 1];
			this.cmd("CreateCircle", circleID,value, this.intitial_point.x+70,this.intitial_point.y);

			let temp_left_node = this.stack[this.stack.length - 1].id;
			let temp_right_node = this.stack[this.stack.length - 2].id;


			let node = new BSTNode(value,circleID,this.intitial_point.x,this.intitial_point.y);
			parent = node;
			node.left = this.stack[this.stack.length - 1];
			node.right = this.stack[this.stack.length - 2];

			node.x = node.right.x + (node.left.x - node.right.x)/2;
			node.y = node.right.y < node.left.y ? node.right.y - this.STANDARD_SPACE : node.left.y - this.STANDARD_SPACE;
			this.cmd("Step");
			this.cmd("Move",circleID, node.x,node.y);
			this.cmd("Step");
			this.cmd("Connect",circleID,temp_left_node);
			this.cmd("Connect",circleID,temp_right_node);
			if(!node.left.hasChild() && node.right.y < node.left.y){
				this.cmd("Step");
				node.left.x = node.right.x + this.STANDARD_SPACE;
				node.left.y = node.right.y;
				this.cmd("Move",node.left.id, node.left.x,node.right.y);
				node.x = node.right.x + this.STANDARD_SPACE/2;
				this.cmd("Move",circleID, node.x,node.y);
			}else {
				moveTree(node.left,0,node.y - node.left.y + this.STANDARD_SPACE);
			}

			if(!node.right.hasChild() && node.right.y > node.left.y){
				this.cmd("Step");
				node.right.x = node.left.x  - this.STANDARD_SPACE;
				node.right.y = node.left.y;
				this.cmd("Move",node.right.id,node.right.x,node.left.y);
				node.x = node.left.x - this.STANDARD_SPACE/2;
				this.cmd("Move",circleID, node.x,node.y);
			}else {
				moveTree(node.right,0,node.y - node.right.y + this.STANDARD_SPACE);
			}

			this.stack.pop();
			this.stack.pop();
			this.stack.push(node);
			this.cmd("Step");
			moveSubtrees();
		}
	}
	this.tree = parent;
	return this.commands;
}

BinaryExpressionTree.prototype.getOperandValue =  function(operand) {
	if(operand == "^"){
		return 3;
	}
	else if(operand == "*" || operand == "/"){
		return 2;
	}else {
		return 1;
	}
}

BinaryExpressionTree.prototype.addControls =  function()
{
	this.controls = [];

	this.onConvertClick = function(){

		let re = /(?<operand>[a-zA-Z0-9]+)(?<operators>[-+/*^()]{0,})/g;
		let match = null;
		let infix = [];
		while((match = re.exec(this.text_field.value)) != null){
			infix.push(match.groups.operand);
			if(match.groups.operators != ""){
				let operators = match.groups.operators.split("");
				for(var i =0; i < operators.length; i++){
					infix.push(operators[i]);
				}

			}
		}

		let stack = [];
		let postfix = [];
		for(var i = 0; i < infix.length; i++){

			if(infix[i].search(/[a-zA-Z0-9]/) != -1){
				postfix.push(infix[i]);
			}else if(stack.length == 0 || stack[stack.length - 1] == "("){
				stack.push(infix[i]);
			} else if(infix[i] == ")" ){
				for(var o = stack.length - 1; o >= 0; o--){
					if(this.getOperandValue(stack[stack.length - 1]) >= this.getOperandValue(infix[i]) && infix[i] != "(" && stack[stack.length - 1] != "(" ){
						postfix.push(stack.pop());
					}
				}
				stack.pop();
			} else if(this.getOperandValue(stack[stack.length - 1]) >= this.getOperandValue(infix[i])){
				for(var o = stack.length - 1; o >= 0; o--){
					if(this.getOperandValue(stack[stack.length - 1]) >= this.getOperandValue(infix[i]) && infix[i] != "(" && stack[stack.length - 1] != "(" ){

						postfix.push(stack.pop());
					}
				}
				stack.push(infix[i]);
			} else if(this.getOperandValue(stack[stack.length - 1]) < this.getOperandValue(infix[i])){
				stack.push(infix[i]);
			}

		}
		for(var o = stack.length - 1; o >= 0; o--){
			if(this.getOperandValue(stack[o]) >= this.getOperandValue(infix[i])){
				postfix.push(stack.pop());
			}
		}

		if(this.isPostfixValid(postfix)){
			this.implementAction(this.loadNodes.bind(this),postfix);
		}else {
			alert("invalid infix notation");
		}

	}

	this.text_field = addControlToAlgorithmBar("Text", "");
	this.text_field.onkeydown = this.returnSubmit(this.text_field,
	                                              null, // callback to make when return is pressed
	                                              50,                     // integer, max number of characters allowed in field
	                                              false);                        // boolean, true of only digits can be entered.
	this.controls.push(this.text_field);
	this.btn_convert = addControlToAlgorithmBar("Button", "convert");
	this.btn_convert.onclick = this.onConvertClick.bind(this);
	this.controls.push(this.btn_convert);


}

BinaryExpressionTree.prototype.partialReset = function(){
	this.intitial_point.x = 50;
	this.nextIndex = 0;
}

BinaryExpressionTree.prototype.reset = function()
{
	this.has_hard_reset = true;
	this.partialReset();
}

BinaryExpressionTree.prototype.disableUI = function(event)
{
	for (var i = 0; i < this.controls.length; i++)
	{
		this.controls[i].disabled = true;
	}
}

BinaryExpressionTree.prototype.enableUI = function(event)
{
	for (var i = 0; i < this.controls.length; i++)
	{
		this.controls[i].disabled = false;
	}
}


var currentAlg;

function init()
{
	var animManag = initCanvas();
	currentAlg = new BinaryExpressionTree(animManag, canvas.width, canvas.height);
}
