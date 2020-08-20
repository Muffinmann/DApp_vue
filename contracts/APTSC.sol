pragma solidity ^0.5.0;

import "./ERC1155.sol";

contract APTSC is ERC1155 {
    event craftedToken(uint256[] _inputIds, uint256[] _inputQuantities, uint256 indexed _outputId, uint256 _outputQuantity, address indexed _actor);
    event serialNumber(string _serialNumber, uint256 indexed _id, address indexed _actor);
    event status(string _status, uint256 indexed _id, address indexed _actor);
    event controllerUpdate(string _type, address indexed _updatedAddress, uint256 indexed _id);
    // string --> bytes32
    bytes4 constant private INTERFACE_SIGNATURE_URI = 0x0e89341c;

    // id => account => is controller
    mapping (uint256 => mapping(address => bool)) public controllers;

    // A nonce to ensure we have a unique id each time we create or craft.
    uint256 public nonce;

    modifier controllerOnly(uint256 _id) {
        require(controllers[_id][msg.sender] == true, "Only controllers may do this");
        _;
    }

    modifier allAvailable(uint256[] memory _inputIds, uint256[] memory _inputQuantities, address operator){
      //check matching input array length
      require(_inputIds.length == _inputQuantities.length, "Number of input Ids and Number of input quantities not equal.");
      //check balance of operator for each token
      for (uint i = 0; i < _inputIds.length; i++){
        require(balances[_inputIds[i]][operator]>=_inputQuantities[i], "Missing funds for crafting");
      }
      _;
    }

/**
  @notice Remained from sample implementation for ERC1155 compliance
  @notice Return true if the the contract supports the specified interface, else refers to the parent contract.
*/
    function supportsInterface(bytes4 _interfaceId)
    public view
    returns (bool) {
        if (_interfaceId == INTERFACE_SIGNATURE_URI) {
            return true;
        } else {
            return super.supportsInterface(_interfaceId);
        }
    }
/*

    function getOwners(uint256 _id)
    public view
    returns (address[] memory){
      address[] memory owners;
      for (uint i=0; i<participants.length; i++){
        if (balances[_id][participants[i]]>0){
          owners[i] = address[i];
        }
      }
      return owners;
    }
  */

/***********************************************************************************************************************************************
SECTION: TOKEN EXISTENCE MANAGEMENT
________________________________________________________________________________________________________________________________________________
DESCRIPTION: This section contains functions for creating, crafting and burning tokens.
***********************************************************************************************************************************************/


/**
    @notice Creates a specified `_initialSupply` of new token with the next available `_id` and gives it to the message sender.
    @notice Token control is given to the message sender.
    @notice Emits a specified `_uri`, `_serialNumber`, and a generic "created" status as well as information about the creation process.
    No conditions apply.
    After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0).
    If so, it MUST call `onERC1155Received` on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
    @param _initialSupply   Amount of the new token
    @param _uri             Link to the parts production data
    @param _serialNumber    The parts serial number
    @param _actor              The account of the entity executing the production process
*/
    function create(uint256 _initialSupply, string calldata _uri, string calldata _serialNumber, address _actor) external returns(uint256 _id) {
        _id = ++nonce;
        controllers[_id][msg.sender] = true;
        emit controllerUpdate("added", msg.sender, _id);
        balances[_id][msg.sender] = _initialSupply;
        emit TransferSingle(msg.sender, address(0x0), _actor, _id, _initialSupply);
        if (bytes(_uri).length > 0)
            emit URI(_uri, _id, _actor);
        if (bytes(_serialNumber).length > 0)
            emit serialNumber(_serialNumber, _id, _actor);
            emit status("created", _id, _actor);
    }

/**
    @notice Burns the `_inputQuantities` of the `_inputIds` in the `operator` account.  Token control is given to the message sender.
    @notice Creates a specified `_outputInitialSupply` of a new token with the next available `_id` and gives it to the `operator`.
    @notice The control over the token is assigned to the message sender.
    @notice Emits a specified `_uri`, `_serialNumber`, and a generic "crafted" status as well as information about the crafting procedure.
    MUST revert if number of input ids and number of specified input quantities are not equal.
    MUST revert if operator does not have sufficient inventory for every input token.
    MUST emit a craft event.
    MUST emit a status event.
    MUST emit a serialNumber event if the parts serial number is specified
    MUST emit a URI event if a uri for part production information is specified.
    After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0).
    If so, it MUST call `onERC1155Received` on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
    @param _inputIds              Array containing the IDs of all tokens that are used in the production of the new part
    @param _inputQuantities       Array containing the Quantities of the input tokens in the same order as the _inputIds parameter
    @param _outputInitialSupply   Amount of the new token
    @param _uri                   Link to the parts production data
    @param _serialNumber          The parts serial number
    @param _actor              The account of the entity executing the production process
*/
    function craft(uint256[] calldata _inputIds, uint256[] calldata _inputQuantities, uint256 _outputInitialSupply, string calldata _uri, address _actor, string calldata _serialNumber)
    external
    returns(uint256 _id){
      //check matching input arrays
      require(_inputIds.length == _inputQuantities.length, "Number of input Ids and Number of input quantities not equal.");
      //check token availability and control
      for (uint i = 0; i < _inputIds.length; i++){
        require(balances[_inputIds[i]][_actor]>=_inputQuantities[i],"Missing funds for crafting");
        require(controllers[_inputIds[i]][msg.sender]==true, "Message sender does not have control over all tokens");
      }
      //burn tokens
      for (uint i = 0; i < _inputIds.length; i++){
        balances[_inputIds[i]][_actor]=balances[_inputIds[i]][_actor].sub(_inputQuantities[i]);
        balances[_inputIds[i]][address(0x0)]=_inputQuantities[i].add(balances[_inputIds[i]][address(0x0)]);
      }
      emit TransferBatch(msg.sender, _actor, address(0x0),_inputIds, _inputQuantities);
      //create token
      _id = ++nonce;
      controllers[_id][msg.sender] = true;
      emit controllerUpdate("added", msg.sender, _id);
      balances[_id][_actor] = _outputInitialSupply;
      // emit craft event
      emit craftedToken(_inputIds, _inputQuantities, _id, _outputInitialSupply, _actor);
      if (bytes(_uri).length > 0)
          emit URI(_uri, _id, _actor);
      if (bytes(_serialNumber).length > 0)
        emit serialNumber(_serialNumber, _id, _actor);
      emit status("crafted", _id, _actor);
    }

/**
    @notice Burns the specified `_quantity` of a token with an `_id` from an `_actor` account.
    MUST revert if sender is not a controller for the token.
    MUST revert if operator does not have the sufficient balance of that token.
    @param _id        The token ID.
    @param _quantity  The quantity to be burned.
    @param _actor  The account of the entity executing the burning process
*/
    function burnTokenBalance(uint _id, uint _quantity, address _actor)
    external controllerOnly(_id){
      require(balances[_id][_actor]>=_quantity, "Specified burn quantity exceeds the operator's balance");
      balances[_id][_actor] = balances[_id][_actor].sub(_quantity);
      balances[_id][address(0x0)] = _quantity.add(balances[_id][address(0x0)]);
      emit TransferSingle(msg.sender, _actor, address(0x0),_id, _quantity);
    }


/***********************************************************************************************************************************************
SECTION: METADATA UPDATES
________________________________________________________________________________________________________________________________________________
DESCRIPTION: This section contains functions for updating token metadata through events.
***********************************************************************************************************************************************/

/**
    @notice Updates the URI of a part by emitting a URI event with a specified _URI for the part's token _id.
    MUST revert if sender is not a controller for the token.
    MUST emit a URI event if the URI length is <0.
    @param _id            The token ID.
    @param _URI           The part's new URI.
    @param _actor      The account of the entity executing the production process
*/
    function newURI(uint256 _id, string calldata _URI, address _actor)
    external controllerOnly(_id){
      if (bytes(_URI).length > 0)
          emit URI(_URI, _id, _actor);
    }

/**
    @notice Updates the status of a part by emitting a status event with a specified _status for the part's token _id.
    MUST revert if sender is not a controller for the token.
    MUST emit a status event if the status length is <0.
    @param _id        The token ID.
    @param _status    The part's new status.
    @param _actor  The account of the entity executing the production process
*/
    function newStatus(uint256 _id, string calldata _status, address _actor)
    external controllerOnly(_id){
      if (bytes(_status).length > 0)
          emit status(_status, _id, _actor);
    }

/**
    @notice Updates the serial number of a part by emitting a serialNumber event with a specified _serialNumber for the part's token _id.
    MUST revert if sender is not a controller for the token.
    MUST emit a serialNumber event if the _serialNumber length is <0.
    @param _id            The token ID.
    @param _serialNumber  The part's new serial number.
    @param _actor      The account of the entity executing the production process
*/
    function newSerialNumber(uint256 _id, string calldata _serialNumber, address _actor)
    external controllerOnly(_id){
      if (bytes(_serialNumber).length > 0)
          emit serialNumber(_serialNumber, _id, _actor);
    }
/**
    @notice Combines all three metadata functions.
    MUST revert if sender is not a controller for the token.
    MUST emit a URI event if the _URI length is <0.
    MUST emit a status event if the _status length is <0.
    MUST emit a serialNumber event if the _serialNumber length is <0.
    @param _id            The token ID.
    @param _URI           The part's new URI
    @param _status        The part's new status
    @param _serialNumber  The part's new serial number.
    @param _actor      The account of the entity executing the production process
*/
    function updateMetadata(uint256 _id, string calldata _URI, string calldata _status, string calldata _serialNumber, address _actor)
    external controllerOnly(_id){
      if (bytes(_URI).length > 0)
          emit URI(_URI, _id, _actor);
      if (bytes(_status).length > 0)
          emit status(_status, _id, _actor);
      if (bytes(_serialNumber).length > 0)
          emit serialNumber(_serialNumber, _id, _actor);
    }
/***********************************************************************************************************************************************
SECTION: TOKEN CONTROL
________________________________________________________________________________________________________________________________________________
DESCRIPTION: This section contains functions for managing token control.
***********************************************************************************************************************************************/
/**
    @notice Returns whether a candidate is a controller of a token
    @param _id              The token ID.
    @param _candidate       The potential controller.
*/
    function isController(uint _id,address _candidate)
    external view
    returns (bool){
      return controllers[_id][_candidate];
    }

/**
    @notice Assigns control over a token to another account.
    MUST revert if sender is not a controller for the token.
    @param _id              The token ID.
    @param _newController   The new token controller.
*/
    function addController(uint _id, address _newController)
    external controllerOnly(_id){
      emit controllerUpdate("added", _newController, _id);
      controllers[_id][_newController]=true;
    }

/**
    @notice Strips control over a token from the sender account.
    MUST revert if sender is not a controller for the token.
    @param _id              The token ID.
*/
    function renounceControl(uint _id)
    external controllerOnly(_id){
      emit controllerUpdate("removed", msg.sender, _id);
      controllers[_id][msg.sender]=false;
    }

/**
    @notice Assigns control over a token to another account and strips the senders account of the controlling rights.
    MUST revert if sender is not a controller for the token.
    @param _id              The token ID.
    @param _newController   The new token controller.
*/
    function transferControl(uint _id, address _newController)
    external controllerOnly(_id){
      emit controllerUpdate("removed", msg.sender, _id);
      emit controllerUpdate("added", _newController, _id);
      controllers[_id][_newController]=true;
      controllers[_id][msg.sender]=false;
    }
}
